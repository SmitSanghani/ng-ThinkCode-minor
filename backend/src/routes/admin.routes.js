const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
    addQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getDashboardStats,
    bulkUploadQuestions
} = require('../controllers/admin.controller');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard-stats', getDashboardStats);
router.post('/add', addQuestion);
router.post('/bulk-upload', upload.single('file'), bulkUploadQuestions);
router.get('/', getQuestions);
router.get('/:id', getQuestionById);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;
