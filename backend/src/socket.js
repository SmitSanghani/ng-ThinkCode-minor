const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./config/env');
const User = require('./models/user.model');

let io;
const activeUsers = new Map(); // userId -> socketId

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

            // Map user to socket
            activeUsers.set(userId, socket.id);
            console.log(`User connected: ${userId}`);

            // Update lastSeen in DB
            await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

            // Notify all admins if status truly changes
            io.emit('statusUpdate', { userId, isOnline: true });

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

const isUserOnline = (userId) => activeUsers.has(userId.toString());

const getActiveUsersCount = () => activeUsers.size;

const getOnlineUserIds = () => [...activeUsers.keys()];

module.exports = { initSocket, getIO, isUserOnline, getActiveUsersCount, getOnlineUserIds };
