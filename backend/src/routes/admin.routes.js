const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
    addQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion
} = require('../controllers/admin.controller');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router.post('/add', addQuestion);
router.get('/', getQuestions);
router.get('/:id', getQuestionById);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;
