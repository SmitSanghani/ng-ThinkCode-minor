const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./config/env');
const User = require('./models/user.model');

let io;
const activeUsers = new Map(); // userId -> { socketId, role }

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
            const userId = decoded.id;

            // Fetch user info from DB
            const user = await User.findById(userId).select('role username name');
            const role = user ? user.role : 'student';
            const name = user ? (user.name || user.username) : 'User';

            // Map user to socket + role + name
            activeUsers.set(userId, { socketId: socket.id, role, name });
            console.log(`User connected: ${userId} (${role})`);

            // Update lastSeen in DB
            await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

            // Notify all clients of status change
            io.emit('statusUpdate', { userId, isOnline: true });

            // ======== INTERVIEW & WEBRTC SIGNALING ========
            socket.on('join-interview', ({ roomId }) => {
                socket.join(roomId);
                socket.to(roomId).emit('user-joined', { userId, role });
                console.log(`User ${userId} joined room ${roomId}`);
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

            // ======== INTERVIEW CHAT ========
            socket.on('chat-message', ({ roomId, message }) => {
                console.log(`Chat: Message in room ${roomId} from ${userId}`);
                io.in(roomId).emit('chat-message', message);
            });
            socket.on('chat-delete', ({ roomId, messageId }) => {
                socket.to(roomId).emit('chat-delete', { messageId });
            });
            socket.on('chat-react', ({ roomId, messageId, reaction }) => {
                socket.to(roomId).emit('chat-react', { messageId, reaction });
            });
            // ======== DIRECT 1-ON-1 CHAT ========
            socket.on('sendMessage', ({ receiverId, text, isInvite, roomId }) => {
                const messagePayload = {
                    sender: name,
                    senderId: userId,
                    text: text,
                    isInvite: isInvite || false,
                    roomId: roomId || null,
                    timestamp: new Date()
                };

                if (receiverId) {
                    emitToUser(receiverId, 'receiveMessage', messagePayload);
                } else {
                    console.log('Broadcast attempted but ignored for privacy');
                }
            });
            // ==============================================

            socket.on('disconnect', () => {
                activeUsers.delete(userId);
                console.log(`User disconnected: ${userId}`);
                io.emit('statusUpdate', { userId, isOnline: false });
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

// Any user online (admin or student)
const isUserOnline = (userId) => activeUsers.has(userId.toString());

// Only non-admin (student) online count
const getActiveUsersCount = () => {
    let count = 0;
    for (const [, data] of activeUsers) {
        if (data.role !== 'admin') count++;
    }
    return count;
};

// Only non-admin online user IDs (for filter queries)
const getOnlineUserIds = () => {
    const ids = [];
    for (const [userId, data] of activeUsers) {
        if (data.role !== 'admin') ids.push(userId);
    }
    return ids;
};

const emitToUser = (userId, event, payload) => {
    const userData = activeUsers.get(userId.toString());
    if (userData && userData.socketId) {
        if (io) {
            io.to(userData.socketId).emit(event, payload);
            return true;
        }
    }
    return false;
};

module.exports = { initSocket, getIO, isUserOnline, getActiveUsersCount, getOnlineUserIds, emitToUser };
