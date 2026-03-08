const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { getDashboardStats } = require('../controllers/admin.controller');

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', getDashboardStats);

// Individual stats if needed (redirecting to the main stats for now to save requests)
router.get('/total-students', (req, res, next) => {
    // We can either implement individual ones or just reuse the logic
    getDashboardStats(req, res, next);
});

module.exports = router;
