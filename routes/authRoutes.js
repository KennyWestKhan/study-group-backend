const express = require('express');
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Reduced window to 15 mins for better UX
  max: 50, // Increased limit for development/testing
  message: { message: 'Too many auth attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
