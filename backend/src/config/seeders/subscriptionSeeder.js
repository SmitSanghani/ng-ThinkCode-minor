const mongoose = require('mongoose');
const User = require('../../models/user.model');
const PremiumPlan = require('../../models/premiumPlan.model');
const Subscription = require('../../models/subscription.model');
const env = require('../env');

const seedData = async () => {
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('✅ MongoDB Connected for Seeding');

        // 1. Clear existing plans and subscriptions (Optional - commented out)
        // await PremiumPlan.deleteMany({});
        // await Subscription.deleteMany({});

        // 2. Create Sample Premium Plans
        const plans = await PremiumPlan.find({});
        let premiumPlan;

        if (plans.length === 0) {
            premiumPlan = await PremiumPlan.create({
                name: 'ThinkCode Premium Plan',
                description: 'Unlock all 2500+ problems, unlimited hints, and full solutions.',
                price: 499,
                currency: 'INR',
                durationDays: 30,
                features: [
                    'Unlock All 2500+ Problems',
                    'Unlimited Video Hints',
                    'Access to Premium Editorial Solutions',
                    'Mock Interview Simulator',
                    'Priority Support'
                ]
            });
            console.log('✅ Created Premium Plan');
        } else {
            premiumPlan = plans[0];
            console.log('ℹ️ Plan already exists');
        }

        // 3. Find a Student to assign subscription
        const student = await User.findOne({ role: 'student' });

        if (student) {
            // Check if student already has a subscription
            const existingSub = await Subscription.findOne({ userId: student._id });

            if (!existingSub) {
                const startDate = new Date();
                const expiryDate = new Date();
                expiryDate.setDate(startDate.getDate() + premiumPlan.durationDays);

                await Subscription.create({
                    userId: student._id,
                    planId: premiumPlan._id,
                    paymentId: 'stripe_mock_' + Math.random().toString(36).substring(7),
                    amount: premiumPlan.price,
                    status: 'Active',
                    startDate: startDate,
                    expiryDate: expiryDate
                });

                // Also update user's plan field to keep it consistent
                student.plan = 'Premium';
                await student.save();

                console.log(`✅ Assigned Premium Plan to Student: ${student.username}`);
            } else {
                console.log(`ℹ️ Student ${student.username} already has an active subscription`);
            }
        } else {
            console.warn('⚠️ No student found in the database to assign a plan.');
        }

        console.log('🚀 Seeding Completed Successfully');
        process.exit();
    } catch (err) {
        console.error('❌ Seeding Error:', err.message);
        process.exit(1);
    }
};

seedData();
