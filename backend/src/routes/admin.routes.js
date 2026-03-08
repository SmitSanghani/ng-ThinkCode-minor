const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
    addQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getDashboardStats
} = require('../controllers/admin.controller');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard-stats', getDashboardStats);
router.post('/add', addQuestion);
router.get('/', getQuestions);
router.get('/:id', getQuestionById);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;
