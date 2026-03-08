const express = require('express');
const { createInterview, getInterviewByRoomId } = require('../controllers/interview.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Route to create a new interview (Admin/Interviewer only)
router.post('/create', protect, authorize('admin'), createInterview);

// Route to validate and fetch interview details
router.get('/:roomId', protect, getInterviewByRoomId);

// Route to run code via Judge0 API
router.post('/run', protect, require('../controllers/interview.controller').runCode);

module.exports = router;
