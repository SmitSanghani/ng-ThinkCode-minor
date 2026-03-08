const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const codeExecutionController = require('../controllers/codeExecutionController');

const { protect, authorize } = require('../middleware/auth.middleware');

// All routes are protected and for students only
router.use(protect);
router.use(authorize('student'));

// ── Problem Routes ──────────────────────────────────────────────────────────
router.get('/problems', studentController.getProblems);
router.get('/problems/:id', studentController.getProblemById);
router.get('/problems/:id/check-access', studentController.checkAccess);
router.get('/profile', studentController.getProfile);

// ── Code Execution ──────────────────────────────────────────────────────────
// POST /api/student/execute-code
// Runs student JS code against all test cases in a vm2 sandbox
router.post('/execute-code', codeExecutionController.executeCode);



module.exports = router;
