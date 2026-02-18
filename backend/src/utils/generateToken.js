const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRE }
    );
};

const generateRefreshToken = (user, tokenId) => {
    return jwt.sign(
        { id: user._id, tokenId },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRE }
    );
};

const verifyToken = (token, secret) => {
    return jwt.verify(token, secret);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
};
