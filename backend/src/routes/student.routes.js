const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes are protected and for students only
router.use(protect);
router.use(authorize('student'));

router.get('/problems', studentController.getProblems);
router.get('/problems/:id', studentController.getProblemById);
router.get('/problems/:id/check-access', studentController.checkAccess);

module.exports = router;
