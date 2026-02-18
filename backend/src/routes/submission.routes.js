const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

// Student routes
router.post('/submit', submissionController.submitSolution);
router.get('/my', submissionController.getMySubmissions);

// Admin only routes
router.use(authorize('admin'));

router.get('/', submissionController.getAllSubmissions);
router.get('/stats', submissionController.getAdminStats);
router.get('/:id', submissionController.getSubmission);
router.put('/:id/grade', submissionController.updateGrade);

module.exports = router;
