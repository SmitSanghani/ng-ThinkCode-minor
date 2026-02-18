const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/user.model');
const { responseHandler } = require('../utils/responseHandler');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return responseHandler(res, 401, false, null, 'Not authorized to access this route');
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-passwordHash');

        if (!req.user) {
            return responseHandler(res, 401, false, null, 'User not found');
        }

        next();
    } catch (err) {
        return responseHandler(res, 401, false, null, 'Not authorized to access this route');
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return responseHandler(
                res,
                403,
                false,
                null,
                `User role ${req.user.role} is not authorized to access this route`
            );
        }
        next();
    };
};

module.exports = { protect, authorize };
