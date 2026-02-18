const userRepository = require('../repositories/user.repository');
const authRepository = require('../repositories/auth.repository');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const crypto = require('crypto');

class AuthService {
    async register(userData) {
        const { username, email, password } = userData;

        // Check if user exists
        const existingUser = await userRepository.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            throw new Error('User with this email or username already exists');
        }

        const hashedPassword = await hashPassword(password);

        const user = await userRepository.create({
            username,
            email,
            passwordHash: hashedPassword
        });

        const verificationToken = user.getEmailVerificationToken();
        await user.save();

        return { user, verificationToken };
    }

    async login(email, password, ipAddress) {
        const user = await userRepository.findByEmail(email);

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await comparePassword(password, user.passwordHash);

        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Check if locked logic could go here
        if (user.lockUntil && user.lockUntil > Date.now()) {
            throw new Error('Account is locked. Please try again later.');
        }

        const accessToken = generateAccessToken(user);
        const refreshTokenHash = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await authRepository.createRefreshToken({
            userId: user._id,
            tokenHash: refreshTokenHash,
            expiresAt,
            ipAddress
        });

        return {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            accessToken,
            refreshToken: refreshTokenHash
        };
    }

    async logout(refreshToken) {
        if (refreshToken) {
            await authRepository.deleteRefreshToken(refreshToken);
        }
    }

    async refreshToken(tokenHash) {
        const tokenDoc = await authRepository.findRefreshToken(tokenHash);

        if (!tokenDoc) {
            throw new Error('Invalid refresh token');
        }

        if (tokenDoc.expiresAt < Date.now()) {
            await authRepository.deleteById(tokenDoc._id);
            throw new Error('Refresh token expired');
        }

        const user = await userRepository.findById(tokenDoc.userId);
        if (!user) {
            throw new Error('User not found');
        }

        const accessToken = generateAccessToken(user);
        return { accessToken, user };
    }

    async getMe(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };
    }
}

module.exports = new AuthService();
