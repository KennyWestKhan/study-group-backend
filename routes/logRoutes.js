const express = require('express');
const { createStudyLog, getDashboardStats } = require('../controllers/logController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, createStudyLog);
router.get('/dashboard', protect, getDashboardStats);

module.exports = router;
