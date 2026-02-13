/**
 * Email Subscription Routes
 */
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect, authorize } = require('../middleware/auth');
const { emailSubscriptionRules, validate } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// POST /api/email/subscribe — Public (guest subscription)
router.post('/subscribe', emailSubscriptionRules, validate, emailController.subscribe);

// GET /api/email/subscribers — Admin only
router.get(
    '/subscribers',
    protect,
    authorize(ROLES.CENTRAL_ADMIN),
    emailController.getSubscribers
);

module.exports = router;
