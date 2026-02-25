const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All submission routes require authentication
router.use(protect);

// --- Student & Shared Routes ---
// These must be defined before the restrictive admin-only ID catch-all

// POST /api/submissions/submit
router.post('/submit', submissionController.submitSolution);

// GET /api/submissions/my
router.get('/my', submissionController.getMySubmissions);

// GET /api/submissions/latest/:questionId
router.get('/latest/:questionId', submissionController.getLatestSubmission);

// --- Admin Only Routes ---
// Using per-route authorization is safer and prevents fall-through 403s

// GET /api/submissions (List all)
router.get('/', authorize('admin'), submissionController.getAllSubmissions);

// GET /api/submissions/stats (Admin stats)
router.get('/stats', authorize('admin'), submissionController.getAdminStats);

// GET /api/submissions/:id (Specific submission detail)
router.get('/:id', authorize('admin'), submissionController.getSubmission);

// PUT /api/submissions/:id/grade (Update grade)
router.put('/:id/grade', authorize('admin'), submissionController.updateGrade);

// DELETE /api/submissions/:id (Delete submission)
router.delete('/:id', authorize('admin'), submissionController.deleteSubmission);


module.exports = router;
