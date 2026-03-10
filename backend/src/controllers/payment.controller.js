const paymentService = require('../services/payment.service');
const { responseHandler } = require('../utils/responseHandler');
const env = require('../config/env');

class PaymentController {
    /**
     * POST /api/payment/create-checkout-session
     * Creates a Stripe checkout session for Premium upgrade
     */
    async createCheckoutSession(req, res, next) {
        try {
            const userId = req.user._id;
            const userEmail = req.user.email;

            const session = await paymentService.createCheckoutSession(userId, userEmail);

            res.status(200).json({
                success: true,
                sessionId: session.id,
                url: session.url
            });
        } catch (err) {
            console.error('❌ [PAYMENT] Checkout session error:', err.message);
            next(err);
        }
    }

    /**
     * POST /api/payment/verify
     * Verifies payment and upgrades user plan
     */
    async verifyPayment(req, res, next) {
        try {
            const { sessionId } = req.body;

            if (!sessionId) {
                return responseHandler(res, 400, false, null, 'Session ID is required');
            }

            const user = await paymentService.verifyAndUpgrade(sessionId);

            res.status(200).json({
                success: true,
                user,
                message: '🎉 Payment verified! You are now a Premium member.'
            });
        } catch (err) {
            console.error('❌ [PAYMENT] Verification error:', err.message);
            next(err);
        }
    }

    /**
     * POST /api/payment/select-free
     * Selects the Free plan (no payment needed)
     */
    async selectFreePlan(req, res, next) {
        try {
            const userId = req.user._id;
            const user = await paymentService.selectFreePlan(userId);

            res.status(200).json({
                success: true,
                user,
                message: 'Free plan activated!'
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /api/payment/select-premium
     * Selects the Premium plan directly (FOR TESTING)
     */
    async selectPremiumPlan(req, res, next) {
        try {
            const userId = req.user._id;
            const user = await paymentService.selectPremiumPlan(userId);

            res.status(200).json({
                success: true,
                user,
                message: 'Premium plan activated! (Test Mode)'
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /api/payment/config
     * Returns the Stripe publishable key to frontend
     */
    async getConfig(req, res) {
        res.status(200).json({
            success: true,
            publishableKey: env.STRIPE_PUBLISHABLE_KEY
        });
    }
}

module.exports = new PaymentController();
