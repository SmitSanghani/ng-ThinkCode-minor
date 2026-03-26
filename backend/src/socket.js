const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./config/env');
const User = require('./models/user.model');
const Chat = require('./models/Chat');
const Interview = require('./models/Interview');

let io;
const activeUsers = new Map(); // userId -> { sockets: Set<socketId>, role, name }
const roomParticipants = new Map(); // roomId -> Set<userId>

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST']
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', async (socket) => {
        const token = socket.handshake.auth.token;
        if (!token) return socket.disconnect();

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
            const userId = decoded.id.toString();

            const user = await User.findById(userId).select('role username name');
            const role = user ? user.role : 'student';
            const name = user ? (user.name || user.username) : 'User';

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

            await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

            // ======== INTERVIEW SIGNALING ========
            socket.on('join-interview', async ({ roomId }) => {
                socket.join(roomId);
                
                if (!roomParticipants.has(roomId)) roomParticipants.set(roomId, new Set());
                roomParticipants.get(roomId).add(userId);

                try {
                    const interview = await Interview.findOne({ roomId });
                    const interviewerId = interview ? interview.interviewerId.toString() : null;

                    // 1. Notify others that I joined
                    socket.to(roomId).emit('user-joined', { userId, role, interviewerId });
                    console.log(`User ${userId} (${role}) joined room ${roomId}`);

                    // 2. Notify ME about who is already here
                    if (roomParticipants.has(roomId)) {
                        roomParticipants.get(roomId).forEach(pid => {
                            if (pid !== userId) {
                                socket.emit('user-joined', { userId: pid, role: 'existing', alreadyHere: true });
                            }
                        });
                    }

                    // Load Chat History
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
                    socket.to(roomId).emit('user-joined', { userId, role, interviewerId: null });
                }
            });

            socket.on('webrtc-offer', ({ roomId, offer }) => {
                if (!offer || !offer.type) return;
                socket.to(roomId).emit('webrtc-offer', { offer, sender: userId });
            });

            socket.on('webrtc-answer', ({ roomId, answer }) => {
                if (!answer || !answer.type) return;
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

            socket.on('media-status', ({ roomId, isVideoActive, isAudioActive }) => {
                socket.to(roomId).emit('peer-media-status', { isVideoActive, isAudioActive, sender: userId });
            });

            socket.on('request-negotiation', ({ roomId }) => {
                socket.to(roomId).emit('request-negotiation', { sender: userId });
            });

            socket.on('leave-interview', ({ roomId }) => {
                socket.leave(roomId);
                socket.to(roomId).emit('user-left', { userId });
                if (roomParticipants.has(roomId)) {
                    roomParticipants.get(roomId).delete(userId);
                }
            });

            // ======== CHAT MESSAGING (NON-BLOCKING) ========
            socket.on('chat-message', async ({ roomId, message }) => {
                if (!message || !message.text?.trim()) return;
                
                // Emit FIRST for real-time delivery
                io.in(roomId).emit('chat-message', message);

                try {
                    const interview = await Interview.findOne({ roomId });
                    if (interview) {
                        const receiverId = userId === interview.interviewerId.toString() 
                            ? interview.candidateId.toString() 
                            : interview.interviewerId.toString();

                        // Save in background
                        saveToUnifiedChat(userId, receiverId, message.text, true);
                        
                        // Sync to global chat
                        emitToUser(receiverId, 'receiveMessage', {
                            sender: name,
                            senderId: userId,
                            text: message.text,
                            timestamp: new Date()
                        });
                    }
                } catch (e) {
                    console.error('Room Chat Error:', e.message);
                }
            });

            socket.on('sendMessage', async ({ receiverId, text, isInvite, roomId }) => {
                if (!receiverId || !text?.trim()) return;

                const payload = {
                    sender: name,
                    senderId: userId,
                    text,
                    isInvite: isInvite || false,
                    roomId: roomId || null,
                    timestamp: new Date()
                };

                // Emit FIRST
                emitToUser(receiverId, 'receiveMessage', payload);

                // Save in background
                saveToUnifiedChat(userId, receiverId, text, false, isInvite, roomId);
            });

            socket.on('typing', ({ receiverId }) => {
                if (receiverId) emitToUser(receiverId, 'typing', { userId, name });
            });

            socket.on('stopTyping', ({ receiverId }) => {
                if (receiverId) emitToUser(receiverId, 'stopTyping', { userId });
            });
            
            socket.on('loadChatHistory', async ({ otherUserId }) => {
                try {
                    const chat = await Chat.findOne({
                        participants: { $all: [userId, otherUserId] }
                    });
                    
                    if (chat) {
                        socket.emit('chatHistory', {
                            userId: otherUserId,
                            messages: chat.messages.map(m => ({
                                senderId: m.senderId,
                                text: m.text,
                                isInvite: m.isInvite,
                                roomId: m.roomId,
                                timestamp: m.createdAt
                            }))
                        });
                    } else {
                        socket.emit('chatHistory', {
                            userId: otherUserId,
                            messages: []
                        });
                    }
                } catch (e) {
                    console.error('Error loading chat history:', e.message);
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

                        // ROOM CLEANUP
                        for (const [rId, participants] of roomParticipants.entries()) {
                            if (participants.has(userId)) {
                                io.to(rId).emit('user-left', { userId });
                                participants.delete(userId);
                            }
                        }
                    }
                }
            });

        } catch (error) {
            socket.disconnect();
        }
    });

    return io;
};

// Background Helper
async function saveToUnifiedChat(senderId, receiverId, text, isRoom, isInvite = false, roomId = null) {
    try {
        let chat = await Chat.findOne({ participants: { $all: [senderId, receiverId] } });
        if (!chat) {
            chat = await Chat.create({ participants: [senderId, receiverId], messages: [] });
        }
        chat.messages.push({
            senderId,
            text,
            isRoomMessage: isRoom,
            isInvite,
            roomId,
            createdAt: new Date()
        });
        if (chat.messages.length > 200) chat.messages.shift();
        await chat.save();
    } catch (e) {
        console.error('Background DB save failed');
    }
}

const getIO = () => io;
const isUserOnline = (uId) => activeUsers.has(uId.toString()) && activeUsers.get(uId.toString()).sockets.size > 0;
const getOnlineUserIds = () => Array.from(activeUsers.keys());
const getActiveUsersCount = () => activeUsers.size;

const emitToUser = (userId, event, payload) => {
    const uId = userId.toString();
    const userData = activeUsers.get(uId);
    if (userData && userData.sockets.size > 0) {
        userData.sockets.forEach(sid => io.to(sid).emit(event, payload));
        return true;
    }
    console.log(`emitToUser: User ${uId} is offline`);
    return false;
};

module.exports = { initSocket, getIO, isUserOnline, getOnlineUserIds, emitToUser, getActiveUsersCount };

