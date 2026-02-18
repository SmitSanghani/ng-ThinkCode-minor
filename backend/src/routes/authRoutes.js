const express = require('express');
const { register, login, logout, refreshToken, getMe, verifyEmail } = require('../controllers/authController');
const { protect } = require('../middleware/auth'); // Corrected path

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);
router.get('/verifyemail/:token', verifyEmail);

module.exports = router;
