const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Question = require('./src/models/question.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to DB and run verification
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/thinkcode')
    .then(() => {
        console.log('DB Connected');
        verify();
    })
    .catch(err => console.error(err));

async function verify() {
    try {
        // 1. Create/Get Admin User
        let admin = await User.findOne({ email: 'admin@test.com' });
        if (!admin) {
            console.log('Creating Admin User...');
            admin = await User.create({
                username: 'admin_test',
                email: 'admin@test.com',
                passwordHash: '$2a$10$abcdefg...',
                role: 'admin',
                isEmailVerified: true
            });
        }

        // 2. Mint Token
        const secret = process.env.JWT_SECRET || 'secret';
        const token = jwt.sign({ id: admin._id }, secret, { expiresIn: '1d' });
        console.log('\nAdmin Token:', token);

        const baseURL = 'http://localhost:5001/api/admin/questions';
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Helper for fetch
        const request = async (url, method, body = null) => {
            const options = { method, headers };
            if (body) options.body = JSON.stringify(body);
            const res = await fetch(baseURL + url, options);
            const data = await res.json().catch(() => ({}));
            return { status: res.status, data };
        };

        // 3. Test Add Question
        console.log('\nTesting Add Question...');
        const newQuestion = {
            title: 'Test Question ' + Date.now(),
            difficulty: 'Medium',
            category: 'Arrays',
            description: 'This is a test question description that is at least 50 characters long to pass validation.',
            functionSignature: 'function test() {}',
            testCases: [
                { input: { a: 1 }, expectedOutput: 2, isSample: true },
                { input: { a: 2 }, expectedOutput: 3 },
                { input: { a: 3 }, expectedOutput: 4 }
            ]
        };

        let qId;
        try {
            const res = await request('/add', 'POST', newQuestion);
            console.log('Add Success:', res.status, res.data);
            if (res.data.success) qId = res.data.data.questionId;
        } catch (e) {
            console.error('Add Failed:', e);
        }

        if (qId) {
            // 4. Test Get All
            console.log('\nTesting Get All...');
            try {
                const res = await request('/', 'GET');
                console.log('Get All Success. Count:', res.data.data.questions.length);
            } catch (e) {
                console.error('Get All Failed:', e);
            }

            // 5. Test Get One
            console.log('\nTesting Get One...');
            try {
                const res = await request(`/${qId}`, 'GET');
                console.log('Get One Success:', res.data.data.title);
            } catch (e) {
                console.error('Get One Failed:', e);
            }

            // 6. Test Update
            console.log('\nTesting Update...');
            try {
                const res = await request(`/${qId}`, 'PUT', { difficulty: 'Hard' });
                console.log('Update Success:', res.data.data.difficulty);
            } catch (e) {
                console.error('Update Failed:', e);
            }

            // 7. Test Delete
            console.log('\nTesting Delete...');
            try {
                const res = await request(`/${qId}`, 'DELETE');
                console.log('Delete Success:', res.status);
            } catch (e) {
                console.error('Delete Failed:', e);
            }
        }

    } catch (err) {
        console.error('Verification Error:', err);
    } finally {
        mongoose.disconnect();
    }
}
