const mongoose = require('mongoose');

const PremiumPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Plan description is required']
    },
    price: {
        type: Number,
        required: [true, 'Plan price is required']
    },
    currency: {
        type: String,
        default: 'INR'
    },
    durationDays: {
        type: Number,
        required: [true, 'Plan duration in days is required']
    },
    features: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PremiumPlan', PremiumPlanSchema);
