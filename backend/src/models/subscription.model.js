const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PremiumPlan',
        required: [true, 'Plan ID is required']
    },
    paymentId: {
        type: String,
        required: [true, 'Payment ID/Session ID is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount paid is required']
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Cancelled', 'Pending'],
        default: 'Active'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
