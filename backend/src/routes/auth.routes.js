const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const limiter = require('../middleware/rateLimiter.middleware');

router.post('/register', limiter, authController.register);
router.post('/login', limiter, authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', protect, authController.getMe);

// Example protected role routes
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
    res.json({ success: true, message: 'Welcome Admin' });
});

router.get('/student-only', protect, authorize('student'), (req, res) => {
    res.json({ success: true, message: 'Welcome Student' });
});

// Explicit endpoints for the frontend redirects
router.get('/admin/dashboard', protect, authorize('admin'), (req, res) => {
    res.json({ success: true, message: 'Admin Dashboard Data' });
});

router.get('/student/home', protect, authorize('student'), (req, res) => {
    res.json({ success: true, message: 'Student Home Data' });
});

module.exports = router;
