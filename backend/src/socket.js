const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./config/env');
const User = require('./models/user.model');
const Chat = require('./models/Chat');
const Interview = require('./models/Interview');

let io;
const activeUsers = new Map(); // userId -> { sockets: Set<socketId>, role, name }
const roomParticipants = new Map(); // roomId -> Set<userId>
const activeExpirations = new Map(); // roomId -> Timeout object


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
            socket.on('join-interview', async ({ roomId, deviceInfo }) => {
                socket.join(roomId);
                
                if (!roomParticipants.has(roomId)) roomParticipants.set(roomId, new Set());
                roomParticipants.get(roomId).add(userId);

                console.log(`[Socket] User ${userId} (${name}) joined room ${roomId} | Device: ${deviceInfo || 'Unknown'}`);

                try {
                    const interview = await Interview.findOne({ roomId });
                    const interviewerId = interview ? interview.interviewerId.toString() : null;

                    if (interview) {
                        cancelInterviewExpiry(roomId);
                        if (interview.expiresAt) {
                            interview.expiresAt = null;
                            await interview.save();
                        }
                    }

                    // 1. Notify others immediately
                    socket.to(roomId).emit('user-joined', { 
                        userId, 
                        role, 
                        interviewerId, 
                        deviceInfo,
                        timestamp: new Date()
                    });

                    // 2. Send FULL ROOM STATUS to the joiner and anyone in the room
                    const participants = Array.from(roomParticipants.get(roomId));
                    io.to(roomId).emit('room-presence-update', { 
                        roomId, 
                        participants,
                        activeUserId: userId 
                    });

                    // 3. Invite peer to send their media status immediately
                    socket.to(roomId).emit('request-media-status', { requesterId: userId });

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
                    console.error('Join Interview Error:', e.message);
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

            socket.on('leave-interview', async ({ roomId }) => {
                socket.leave(roomId);
                socket.to(roomId).emit('user-left', { userId });
                if (roomParticipants.has(roomId)) {
                    roomParticipants.get(roomId).delete(userId);
                    scheduleInterviewExpiry(roomId);
                    
                    // Notify remaining about current presence
                    const participants = Array.from(roomParticipants.get(roomId));
                    io.to(roomId).emit('room-presence-update', { roomId, participants });
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
                            messages: await Promise.all(chat.messages.map(async (m) => {
                                let isExpired = false;
                                if (m.isInvite && m.roomId) {
                                    const interview = await Interview.findOne({ roomId: m.roomId }).select('status');
                                    isExpired = interview?.status === 'completed';
                                }
                                return {
                                    senderId: m.senderId,
                                    text: m.text,
                                    isInvite: m.isInvite,
                                    isExpired,
                                    roomId: m.roomId,
                                    timestamp: m.createdAt
                                };
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
                                participants.delete(userId);
                                io.to(rId).emit('user-left', { userId });
                                
                                // Update remaining people
                                const updatedList = Array.from(participants);
                                io.to(rId).emit('room-presence-update', { roomId: rId, participants: updatedList });
                                
                                scheduleInterviewExpiry(rId);
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

const scheduleInterviewExpiry = (roomId) => {
    // Only one timer per room
    if (activeExpirations.has(roomId)) return;

    console.log(`Scheduling expiry for room ${roomId} in 5 minutes`);
    const timeout = setTimeout(async () => {
        try {
            activeExpirations.delete(roomId);
            const interview = await Interview.findOne({ roomId });
            if (interview && interview.status !== 'completed') {
                interview.status = 'completed';
                interview.expiresAt = new Date();
                await interview.save();

                // Notify participants via global chat event
                const participants = [interview.interviewerId.toString(), interview.candidateId.toString()];
                participants.forEach(pId => {
                    emitToUser(pId, 'interview-expired', { roomId });
                });

                console.log(`Interview ${roomId} expired after 5 minutes of inactivity.`);
            }
        } catch (e) {
            console.error('Error during interview expiry:', e);
        }
    }, 5 * 60 * 1000); // 5 minutes

    activeExpirations.set(roomId, timeout);
};

const cancelInterviewExpiry = (roomId) => {
    if (activeExpirations.has(roomId)) {
        console.log(`Cancelling expiry for room ${roomId}`);
        clearTimeout(activeExpirations.get(roomId));
        activeExpirations.delete(roomId);
    }
};

module.exports = { initSocket, getIO, isUserOnline, getOnlineUserIds, emitToUser, getActiveUsersCount };


