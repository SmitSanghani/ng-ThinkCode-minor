const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/adminUser.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);

module.exports = router;
