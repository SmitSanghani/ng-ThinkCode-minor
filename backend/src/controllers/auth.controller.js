const authService = require('../services/auth.service');
const { responseHandler } = require('../utils/responseHandler');
const sendEmail = require('../utils/sendEmail');
const { welcomeEmail } = require('../utils/emailTemplates');
const env = require('../config/env');

class AuthController {
    async register(req, res, next) {
        try {
            const result = await authService.register({ ...req.body, ipAddress: req.ip });
            const { user } = result;

            // Send welcome congratulations email (fire-and-forget — never blocks registration)
            console.log(`\n🎉 [EMAIL] Sending welcome email to: ${user.email}...`);
            sendEmail({
                email: user.email,
                subject: '🎉 Congratulations! Successfully Registered in ThinkCode',
                html: welcomeEmail(user.username),
                message: `Congratulations ${user.username}! You have successfully registered in ThinkCode.`
            })
                .then(() => console.log(`✅ [EMAIL] Welcome email sent to: ${user.email}`))
                .catch(err => console.error(`❌ [EMAIL] Failed for ${user.email}: ${err.message}`));

            const options = {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'Lax'
            };

            res.status(201)
                .cookie('refreshToken', result.refreshToken, options)
                .json({
                    success: true,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    user: result.user,
                    message: 'Account created and logged in successfully!'
                });
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
                    refreshToken: result.refreshToken,
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
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                return responseHandler(res, 401, false, null, 'Not authorized, no token');
            }

            const result = await authService.refreshToken(refreshToken);

            res.status(200).json({
                success: true,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: {
                    id: result.user._id,
                    username: result.user.username,
                    email: result.user.email,
                    role: result.user.role
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
