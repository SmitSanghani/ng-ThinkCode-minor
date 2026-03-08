/**
 * @fileoverview Authentication Middleware.
 */

'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Protect routes - only authenticated users.
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized.' });
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-passwordHash');

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        // Update lastSeen (Throttled to once every 1 minute)
        const now = new Date();
        if (!req.user.lastSeen || (now - new Date(req.user.lastSeen)) > 60000) {
            req.user.lastSeen = now;
            await User.findByIdAndUpdate(req.user._id, { lastSeen: now });
        }

        next();
    } catch (err) {
        logger.error(`Auth Middleware Error: ${err.message}`);
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

/**
 * Authorize roles.
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        // Admin bypasses all role checks
        if (req.user.role === 'admin') {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized.`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
