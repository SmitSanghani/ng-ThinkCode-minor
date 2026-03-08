const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

// Get Stripe publishable key (public)
router.get('/config', paymentController.getConfig);

// Create checkout session (auth required)
router.post('/create-checkout-session', protect, paymentController.createCheckoutSession);

// Verify payment and upgrade plan (auth required)
router.post('/verify', protect, paymentController.verifyPayment);

// Select free plan (auth required)
router.post('/select-free', protect, paymentController.selectFreePlan);

module.exports = router;
