const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public routes (maybe students need to see titles?)
router.get('/', protect, questionController.getAllQuestions);
router.get('/:id', protect, questionController.getQuestion);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', questionController.createQuestion);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);
router.get('/admin/stats', questionController.getStats);

module.exports = router;
