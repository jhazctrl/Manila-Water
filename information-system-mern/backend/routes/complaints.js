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

// POST /api/complaints â€" Submit complaint (authenticated users)
router.post(
    '/',
    protect,
    upload.single('supporting_img'),
    complaintRules,
    validate,
    complaintController.submitComplaint
);

// GET /api/complaints/brgy â€" Get barangay-specific complaints (barangay admin)
router.get(
    '/brgy',
    protect,
    authorize(ROLES.BARANGAY_ADMIN),
    complaintController.getComplaints
);

// GET /api/complaints â€" Get all (admin)
router.get(
    '/',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    complaintController.getComplaints
);

// GET /api/complaints/my â€" Get my complaints
router.get('/my', protect, complaintController.getMyComplaints);

// PUT /api/complaints/:id/verify â€" Verify complaint (barangay admin)
router.put(
    '/:id/verify',
    protect,
    authorize(ROLES.BARANGAY_ADMIN),
    complaintController.verifyComplaint
);

// PUT /api/complaints/:id/reject â€" Reject complaint (barangay admin)
router.put(
    '/:id/reject',
    protect,
    authorize(ROLES.BARANGAY_ADMIN),
    complaintController.rejectComplaint
);

// PUT /api/complaints/status â€" Update status (admin)
router.put(
    '/status',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    statusUpdateRules,
    validate,
    complaintController.updateComplaintStatus
);

// GET /api/complaints/overview â€" Dashboard stats (admin)
router.get(
    '/overview',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    complaintController.getComplaintsOverview
);

// GET /api/complaints/recurring â€" Recurring problems (admin)
router.get(
    '/recurring',
    protect,
    authorize(ROLES.BARANGAY_ADMIN, ROLES.CENTRAL_ADMIN),
    complaintController.getRecurringProblems
);

module.exports = router;
