/**
 * Advisory Routes
 */
const express = require('express');
const router = express.Router();
const advisoryController = require('../controllers/advisoryController');
const { protect, authorize } = require('../middleware/auth');
const { advisoryRules, validate } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// GET /api/advisories/public — Public route (no auth) for index page
router.get('/public', advisoryController.getAdvisories);

// GET /api/advisories/stats — Advisory statistics (central admin only)
router.get(
    '/stats',
    protect,
    authorize(ROLES.CENTRAL_ADMIN),
    advisoryController.getAdvisoryStats
);

// POST /api/advisories — Create advisory (admin only)
router.post(
    '/',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    advisoryRules,
    validate,
    advisoryController.createAdvisory
);

// GET /api/advisories — Get active advisories (authenticated)
router.get('/', protect, advisoryController.getAdvisories);

// GET /api/advisories/all — Get all advisories (admin)
router.get(
    '/all',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    advisoryController.getAllAdvisories
);

// PUT /api/advisories/:id/resolve — Resolve advisory (admin)
router.put(
    '/:id/resolve',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    advisoryController.resolveAdvisory
);

// PUT /api/advisories/:id/ongoing — Set ongoing (admin)
router.put(
    '/:id/ongoing',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    advisoryController.setOngoingAdvisory
);

module.exports = router;
