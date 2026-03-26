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

        // Create user — isEmailVerified: true so they can login right away
        const user = await userRepository.create({
            username,
            email,
            passwordHash: hashedPassword,
            isEmailVerified: true
        });

        // Auto-login after registration
        const accessToken = generateAccessToken(user);
        const refreshTokenHash = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await authRepository.createRefreshToken({
            userId: user._id,
            tokenHash: refreshTokenHash,
            expiresAt,
            ipAddress: userData.ipAddress || 'unknown'
        });

        return {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                plan: user.plan,
                paymentReturnUrl: user.paymentReturnUrl
            },
            accessToken,
            refreshToken: refreshTokenHash
        };
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
                role: user.role,
                plan: user.plan || 'Free',
                paymentReturnUrl: user.paymentReturnUrl
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
        return { accessToken, refreshToken: tokenHash, user };
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
            role: user.role,
        };
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await userRepository.findById(userId, '+passwordHash');
        if (!user) {
            throw new Error('User not found');
        }

        const isMatch = await comparePassword(currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new Error('Incorrect current password');
        }

        const hashedPassword = await hashPassword(newPassword);
        user.passwordHash = hashedPassword;
        await user.save();

        return { success: true, message: 'Password updated successfully' };
    }

    async getAdminInfo() {
        const admin = await userRepository.findOne({ role: 'admin' });
        if (!admin) {
            throw new Error('No admin found in the system');
        }
        return {
            id: admin._id,
            name: admin.name || admin.username,
            username: admin.username,
            email: admin.email
        };
    }
}

module.exports = new AuthService();
