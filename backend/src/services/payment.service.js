const env = require('../config/env');
const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const PremiumPlan = require('../models/premiumPlan.model');

class PaymentService {
    /**
     * Create a Stripe Checkout Session for Premium plan upgrade
     */
    async createCheckoutSession(userId, userEmail, returnUrl, frontendUrl) {
        const baseUrl = frontendUrl || env.FRONTEND_URL || 'http://localhost:4200';
        // Fetch plan details to get correct price and metadata
        const plan = await PremiumPlan.findOne({ name: 'ThinkCode Premium Plan' });
        const planId = plan ? plan._id : null;
        const amount = plan ? plan.price * 100 : 49900; // default 499 in paise

        // Save returnUrl to DB
        if (returnUrl) {
            await User.findByIdAndUpdate(userId, { paymentReturnUrl: returnUrl });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: userEmail,
            metadata: {
                userId: userId.toString(),
                plan: 'Premium',
                planId: planId ? planId.toString() : ''
            },
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: plan ? plan.name : 'ThinkCode Premium Plan',
                            description: plan ? plan.description : 'Unlock all 2500+ problems, unlimited hints, and full solutions.',
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/student/plans?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/student/plans?payment=cancelled`,
        });

        return session;
    }

    /**
     * Verify checkout session and upgrade user plan
     */
    async verifyAndUpgrade(sessionId) {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            throw new Error('Payment not completed');
        }

        const userId = session.metadata.userId;
        const planId = session.metadata.planId;

        // Start user upgrade
        const user = await User.findByIdAndUpdate(
            userId,
            { plan: 'Premium' },
            { new: true }
        );

        if (!user) {
            throw new Error('User not found');
        }

        // Create subscription record
        if (planId) {
            const plan = await PremiumPlan.findById(planId);
            if (plan) {
                const startDate = new Date();
                const expiryDate = new Date();
                expiryDate.setDate(startDate.getDate() + plan.durationDays);

                await Subscription.create({
                    userId,
                    planId,
                    paymentId: sessionId,
                    amount: plan.price,
                    status: 'Active',
                    startDate,
                    expiryDate
                });
            }
        }

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            plan: user.plan,
            paymentReturnUrl: user.paymentReturnUrl
        };
    }

    /**
     * Set user to Free plan (no payment)
     */
    async selectFreePlan(userId, returnUrl) {
        const updateData = { plan: 'Free' };
        if (returnUrl) updateData.paymentReturnUrl = returnUrl;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            plan: user.plan,
            paymentReturnUrl: user.paymentReturnUrl
        };
    }

    /**
     * Set user to Premium plan directly (FOR TESTING)
     */
    async selectPremiumPlan(userId, returnUrl) {
        const updateData = { plan: 'Premium' };
        if (returnUrl) updateData.paymentReturnUrl = returnUrl;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            plan: user.plan,
            paymentReturnUrl: user.paymentReturnUrl
        };
    }
}

module.exports = new PaymentService();
