const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    plan: {
        type: String,
        enum: ['Free', 'Basic', 'Premium'],
        default: 'Free'
    },
    passwordHash: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate and hash email verification token
UserSchema.methods.getEmailVerificationToken = function () {
    const verificationToken = crypto.randomBytes(20).toString('hex');

    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    return verificationToken;
};

module.exports = mongoose.model('User', UserSchema);
