const User = require('../models/user.model');
const { hashPassword } = require('../utils/hash');
const env = require('./env');

const seedAdmin = async () => {
    try {
        const adminEmail = env.SMTP_EMAIL || 'admin@gmail.com'; // Fallback if not in env
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

        const existingAdmin = await User.findOne({ role: 'admin' });

        if (!existingAdmin) {
            console.log('Seeding default admin...');

            const hashedPassword = await hashPassword(adminPassword);

            await User.create({
                username: 'admin',
                email: adminEmail,
                passwordHash: hashedPassword,
                role: 'admin',
                isEmailVerified: true
            });

            console.log('Default admin created successfully.');
        } else {
            console.log('Admin already exists. Skipping seeding.');
        }
    } catch (err) {
        console.error('Error seeding admin:', err.message);
    }
};

module.exports = seedAdmin;
