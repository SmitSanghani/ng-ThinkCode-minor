const authService = require('../services/auth.service');
const { responseHandler } = require('../utils/responseHandler');
const sendEmail = require('../utils/sendEmail');
const env = require('../config/env');

class AuthController {
    async register(req, res, next) {
        try {
            const { user, verificationToken } = await authService.register(req.body);

            const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verifyemail/${verificationToken}`;
            const message = `Please click on the link to verify your email: \n\n ${verifyUrl}`;

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Email Verification',
                    message
                });

                responseHandler(res, 201, true, null, 'Email sent. Please verify your email to login.');
            } catch (err) {
                console.error('Email send error:', err);
                console.log('--- VERIFICATION LINK (Dev Mode) ---');
                console.log(verifyUrl);
                console.log('------------------------------------');

                responseHandler(res, 201, true, null, 'User created. Email failed to send. Check console.');
            }
        } catch (err) {
            next(err);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return responseHandler(res, 400, false, null, 'Please provide email and password');
            }

            const result = await authService.login(email, password, req.ip);

            const options = {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'Lax' // Use Lax for better compatibility during dev
            };

            res.status(200)
                .cookie('refreshToken', result.refreshToken, options)
                .json({
                    success: true,
                    accessToken: result.accessToken,
                    user: result.user
                });
        } catch (err) {
            next(err);
        }
    }

    async logout(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            await authService.logout(refreshToken);

            res.cookie('refreshToken', 'none', {
                expires: new Date(Date.now() + 10 * 1000),
                httpOnly: true
            });

            responseHandler(res, 200, true, null, 'Logged out successfully');
        } catch (err) {
            next(err);
        }
    }

    async refreshToken(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return responseHandler(res, 401, false, null, 'Not authorized, no token');
            }

            const { accessToken, user } = await authService.refreshToken(refreshToken);

            res.status(200).json({
                success: true,
                accessToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (err) {
            // Force logout if refresh fails
            res.cookie('refreshToken', 'none', {
                expires: new Date(Date.now() + 10 * 1000),
                httpOnly: true
            });
            next(err);
        }
    }

    async getMe(req, res, next) {
        try {
            const user = await authService.getMe(req.user.id);
            responseHandler(res, 200, true, user, 'User details retrieved');
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AuthController();
