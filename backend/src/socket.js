const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./config/env');
const User = require('./models/user.model');
const Chat = require('./models/Chat');
const Interview = require('./models/Interview');

let io;
// Map: userId -> { sockets: Set<socketId>, role, name }
const activeUsers = new Map();

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', async (socket) => {
        // Authenticate socket connection
        const token = socket.handshake.auth.token;
        if (!token) return socket.disconnect();

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
            const userId = decoded.id.toString();

            // Fetch user info from DB
            const user = await User.findById(userId).select('role username name');
            const role = user ? user.role : 'student';
            const name = user ? (user.name || user.username) : 'User';

            // Add to active users
            if (!activeUsers.has(userId)) {
                activeUsers.set(userId, { 
                    sockets: new Set([socket.id]), 
                    role, 
                    name 
                });
                console.log(`User connected: ${userId} (${role}) - New Session`);
                io.emit('statusUpdate', { userId, isOnline: true });
            } else {
                activeUsers.get(userId).sockets.add(socket.id);
            }

            // Update lastSeen in DB
            await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

            // ======== INTERVIEW & WEBRTC SIGNALING ========
            socket.on('join-interview', async ({ roomId }) => {
                socket.join(roomId);
                socket.to(roomId).emit('user-joined', { userId, role });
                console.log(`User ${userId} joined room ${roomId}`);
                
                // UNIFIED CHAT: Load messages from the Chat document instead of Interview
                try {
                    const interview = await Interview.findOne({ roomId });
                    if (interview) {
                        const otherUserId = userId === interview.interviewerId.toString() 
                            ? interview.candidateId.toString() 
                            : interview.interviewerId.toString();

                        const chat = await Chat.findOne({
                            participants: { $all: [userId, otherUserId] }
                        });

                        if (chat && chat.messages) {
                            socket.emit('roomChatHistory', {
                                roomId,
                                messages: chat.messages.map(m => ({
                                    senderId: m.senderId,
                                    text: m.text,
                                    isInvite: m.isInvite,
                                    roomId: m.roomId,
                                    timestamp: m.createdAt,
                                    sender: m.senderId.toString() === userId ? name : 'Other'
                                }))
                            });
                        }
                    }
                } catch (e) {
                    console.error('Error loading room history from Unified Chat:', e.message);
                }
            });

            socket.on('webrtc-offer', ({ roomId, offer }) => {
                socket.to(roomId).emit('webrtc-offer', { offer, sender: userId });
            });

            socket.on('webrtc-answer', ({ roomId, answer }) => {
                socket.to(roomId).emit('webrtc-answer', { answer, sender: userId });
            });

            socket.on('webrtc-candidate', ({ roomId, candidate }) => {
                socket.to(roomId).emit('webrtc-candidate', { candidate, sender: userId });
            });

            socket.on('camera-toggle', ({ roomId, isVideoActive }) => {
                socket.to(roomId).emit('peer-camera-toggled', { isVideoActive, sender: userId });
            });

            socket.on('mic-toggle', ({ roomId, isAudioActive }) => {
                socket.to(roomId).emit('peer-mic-toggled', { isAudioActive, sender: userId });
            });

            socket.on('screen-share-status', ({ roomId, isSharing }) => {
                socket.to(roomId).emit('peer-screen-share', { isSharing, sender: userId });
            });

            socket.on('leave-interview', ({ roomId }) => {
                socket.leave(roomId);
                socket.to(roomId).emit('user-left', { userId });
            });

            // ======== CODE SYNC ========
            socket.on('code-change', ({ roomId, code }) => {
                socket.to(roomId).emit('code-change', { code, sender: userId });
            });

            // ======== INTERVIEW CHAT (SAVE TO UNIFIED CHAT) ========
            socket.on('chat-message', async ({ roomId, message }) => {
                console.log(`Chat: Message in room ${roomId} from ${userId}`);
                try {
                    // Find participants
                    const interview = await Interview.findOne({ roomId });
                    if (interview) {
                        const receiverId = userId === interview.interviewerId.toString() 
                            ? interview.candidateId.toString() 
                            : interview.interviewerId.toString();

                        // Save to Unified Chat
                        let chat = await Chat.findOne({
                            participants: { $all: [userId, receiverId] }
                        });

                        if (!chat) {
                            chat = await Chat.create({
                                participants: [userId, receiverId],
                                messages: []
                            });
                        }

                        chat.messages.push({
                            senderId: userId,
                            text: message.text,
                            isRoomMessage: true,
                            timestamp: new Date()
                        });
                        
                        if (chat.messages.length > 200) chat.messages.shift();
                        await chat.save();

                        // Sync to global chat if they are online but not in room
                        emitToUser(receiverId, 'receiveMessage', {
                            sender: name,
                            senderId: userId,
                            text: message.text,
                            timestamp: new Date()
                        });
                    }
                    
                    io.in(roomId).emit('chat-message', message);
                } catch (e) {
                    console.error('Error saving room message to Unified Chat:', e.message);
                }
            });

            // ======== DIRECT 1-ON-1 CHAT ========
            socket.on('sendMessage', async ({ receiverId, text, isInvite, roomId }) => {
                try {
                    const messagePayload = {
                        sender: name,
                        senderId: userId,
                        text: text,
                        isInvite: isInvite || false,
                        roomId: roomId || null,
                        timestamp: new Date()
                    };

                    let chat = await Chat.findOne({
                        participants: { $all: [userId, receiverId] }
                    });

                    if (!chat) {
                        chat = await Chat.create({
                            participants: [userId, receiverId],
                            messages: []
                        });
                    }

                    chat.messages.push({
                        senderId: userId,
                        text: text,
                        isInvite: isInvite || false,
                        roomId: roomId || null,
                        createdAt: new Date()
                    });
                    
                    if (chat.messages.length > 200) chat.messages.shift();
                    await chat.save();

                    if (receiverId) {
                        emitToUser(receiverId, 'receiveMessage', messagePayload);
                    }
                } catch (err) {
                    console.error('Error saving direct message:', err.message);
                }
            });

            socket.on('typing', ({ receiverId }) => {
                if (receiverId) {
                    emitToUser(receiverId, 'typing', { userId, name });
                }
            });

            socket.on('stopTyping', ({ receiverId }) => {
                if (receiverId) {
                    emitToUser(receiverId, 'stopTyping', { userId });
                }
            });

            socket.on('loadChatHistory', async ({ otherUserId }) => {
                try {
                    const chat = await Chat.findOne({
                        participants: { $all: [userId, otherUserId] }
                    });

                    const messages = chat ? chat.messages : [];

                    socket.emit('chatHistory', {
                        userId: otherUserId,
                        messages: messages.map(m => ({
                            senderId: m.senderId,
                            text: m.text,
                            isInvite: m.isInvite,
                            roomId: m.roomId,
                            timestamp: m.createdAt || m.timestamp,
                            sender: m.senderId.toString() === userId ? name : 'Other'
                        }))
                    });
                } catch (err) {
                    console.error('Error loading chat history:', err.message);
                }
            });

            socket.on('disconnect', () => {
                const userData = activeUsers.get(userId);
                if (userData) {
                    userData.sockets.delete(socket.id);
                    if (userData.sockets.size === 0) {
                        activeUsers.delete(userId);
                        console.log(`User disconnected: ${userId} - All sessions closed`);
                        io.emit('statusUpdate', { userId, isOnline: false });
                    }
                }
            });

        } catch (error) {
            console.error('Socket Auth Error:', error.message);
            socket.disconnect();
        }
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};

const isUserOnline = (userId) => activeUsers.has(userId.toString());

const getActiveUsersCount = () => {
    let count = 0;
    for (const [, data] of activeUsers) {
        if (data.role !== 'admin') count++;
    }
    return count;
};

const getOnlineUserIds = () => {
    const ids = [];
    for (const [userId, data] of activeUsers) {
        if (data.role !== 'admin') ids.push(userId);
    }
    return ids;
};

const emitToUser = (userId, event, payload) => {
    const userData = activeUsers.get(userId.toString());
    if (userData && userData.sockets.size > 0) {
        if (io) {
            userData.sockets.forEach(socketId => {
                io.to(socketId).emit(event, payload);
            });
            return true;
        }
    }
    return false;
};

module.exports = { initSocket, getIO, isUserOnline, getActiveUsersCount, getOnlineUserIds, emitToUser };
