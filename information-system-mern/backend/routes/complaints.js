/**
 * Complaint Routes
 */
const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const { complaintRules, statusUpdateRules, validate } = require('../middleware/validation');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

// POST /api/complaints — Submit complaint (authenticated users)
router.post(
    '/',
    protect,
    upload.single('supporting_img'),
    complaintRules,
    validate,
    complaintController.submitComplaint
);

// GET /api/complaints — Get all (admin)
router.get(
    '/',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    complaintController.getComplaints
);

// GET /api/complaints/my — Get my complaints
router.get('/my', protect, complaintController.getMyComplaints);

// PUT /api/complaints/status — Update status (admin)
router.put(
    '/status',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    statusUpdateRules,
    validate,
    complaintController.updateComplaintStatus
);

// GET /api/complaints/overview — Dashboard stats (admin)
router.get(
    '/overview',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    complaintController.getComplaintsOverview
);

// GET /api/complaints/recurring — Recurring problems (admin)
router.get(
    '/recurring',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    complaintController.getRecurringProblems
);

module.exports = router;
