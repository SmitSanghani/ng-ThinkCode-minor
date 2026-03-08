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

            // Fetch user role from DB
            const user = await User.findById(userId).select('role');
            const role = user ? user.role : 'student';

            // Map user to socket + role
            activeUsers.set(userId, { socketId: socket.id, role });
            console.log(`User connected: ${userId} (${role})`);

            // Update lastSeen in DB
            await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

            // Notify all clients of status change
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

module.exports = { initSocket, getIO, isUserOnline, getActiveUsersCount, getOnlineUserIds };
