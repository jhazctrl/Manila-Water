/**
 * Authentication Routes
 * 
 * Security: Rate limiting on auth endpoints, input validation, CSRF
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules, changePasswordRules, validate } = require('../middleware/validation');

// POST /api/auth/register
router.post('/register', authLimiter, registerRules, validate, authController.register);

// POST /api/auth/login
router.post('/login', authLimiter, loginRules, validate, authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me — Protected
router.get('/me', protect, authController.getMe);

// PUT /api/auth/change-password — Protected + stricter rate limiting
router.put('/change-password', protect, passwordResetLimiter, changePasswordRules, validate, authController.changePassword);

module.exports = router;
