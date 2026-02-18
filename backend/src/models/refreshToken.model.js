const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    ipAddress: String,
    deviceInfo: String,
    isRevoked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

RefreshTokenSchema.virtual('isExpired').get(function () {
    return Date.now() >= this.expiresAt;
});

RefreshTokenSchema.virtual('isActive').get(function () {
    return !this.isRevoked && !this.isExpired;
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
