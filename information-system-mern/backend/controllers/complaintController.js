/**
 * Complaint Controller
 * 
 * Handles: submit, getAll, getByUser, updateStatus, getOverview, getRecurring
 * Converted from: submit_complaint.php, get_complaints.php, update_complaintStatus.php, etc.
 */
const Complaint = require('../models/Complaint');
const { ROLES, COMPLAINT_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * POST /api/complaints
 * Submit a new complaint (authenticated users)
 */
exports.submitComplaint = async (req, res, next) => {
    try {
        const {
            contact_no, address_detail, brgy_id, street_id,
            complaint_type, complaint_duration, complaint_description,
        } = req.body;

        // Generate complaint ID: MWC-YYYY-MM-NNNNN
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `MWC-${year}-${month}`;

        // Find the latest complaint ID for this month
        const latestComplaint = await Complaint.findOne(
            { complaint_id: { $regex: `^${prefix}` } },
            { complaint_id: 1 }
        ).sort({ complaint_id: -1 });

        let latestNumber = 0;
        if (latestComplaint && latestComplaint.complaint_id) {
            const parts = latestComplaint.complaint_id.split('-');
            if (parts.length === 4) {
                latestNumber = parseInt(parts[3], 10);
            }
        }

        const newNumber = String(latestNumber + 1).padStart(5, '0');
        const complaint_id = `${prefix}-${newNumber}`;

        // Handle optional image upload
        let supporting_img = null;
        if (req.file) {
            supporting_img = req.file.filename;
        }

        // Create complaint document
        const complaint = await Complaint.create({
            complaint_id,
            complaint_description: complaint_description || '',
            complaint_type: parseInt(complaint_type, 10),
            complaint_duration: parseInt(complaint_duration, 10),
            status: 'Pending',
            complaint_date: new Date(),
            contact_no: parseInt(contact_no, 10),
            address_detail: address_detail.trim(),
            street_id: parseInt(street_id, 10),
            barangay_id: parseInt(brgy_id, 10),
            submitted_by: req.user.user_id,
            supporting_img,
        });

        logger.info(`Complaint submitted: ${complaint_id} by user ${req.user.user_id}`);

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully!',
            data: { complaint_id },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/complaints
 * Get all complaints with lookups (admin view)
 * Converted from get_complaints.php aggregation pipeline
 */
exports.getComplaints = async (req, res, next) => {
    try {
        // Build filter based on role
        const filter = {};
        if (req.user.role_id === ROLES.BARANGAY_ADMIN) {
            filter.barangay_id = req.user.barangay_id;
        }

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'Complaint_types',
                    localField: 'complaint_type',
                    foreignField: 'complaint_type_id',
                    as: 'type_info',
                },
            },
            {
                $lookup: {
                    from: 'Streets',
                    localField: 'street_id',
                    foreignField: 'street_id',
                    as: 'street_info',
                },
            },
            {
                $lookup: {
                    from: 'Barangays',
                    localField: 'barangay_id',
                    foreignField: 'brgy_id',
                    as: 'barangay_info',
                },
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'submitted_by',
                    foreignField: 'user_id',
                    as: 'user_info',
                },
            },
            { $unwind: { path: '$type_info', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$street_info', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$barangay_info', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
            { $sort: { complaint_date: -1 } },
            {
                $project: {
                    complaint_id: 1,
                    complaint_description: 1,
                    complaint_type: '$type_info.complaint_type',
                    status: 1,
                    complaint_date: 1,
                    created_at: '$complaint_date', // Add alias for frontend compatibility
                    address_detail: 1,
                    street_name: '$street_info.street_name',
                    brgy_number: '$barangay_info.brgy_number',
                    contact_no: 1,
                    submitted_by: {
                        $concat: [
                            { $ifNull: ['$user_info.first_name', ''] },
                            ' ',
                            { $ifNull: ['$user_info.last_name', ''] },
                        ],
                    },
                    supporting_img: 1,
                },
            },
        ];

        const complaints = await Complaint.aggregate(pipeline);

        // Get stats
        const statsMatch = req.user.role_id === ROLES.BARANGAY_ADMIN
            ? { barangay_id: req.user.barangay_id }
            : {};

        const stats = await Complaint.aggregate([
            { $match: statsMatch },
            {
                $group: {
                    _id: { $toLower: '$status' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const statsObj = { total: 0, pending: 0, unresolved: 0, verified: 0, resolved: 0, rejected: 0 };
        stats.forEach((s) => {
            if (statsObj.hasOwnProperty(s._id)) {
                statsObj[s._id] = s.count;
            }
            statsObj.total += s.count;
        });

        res.status(200).json({
            success: true,
            data: complaints,
            stats: statsObj,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/complaints/my
 * Get complaints submitted by the current user
 */
exports.getMyComplaints = async (req, res, next) => {
    try {
        const pipeline = [
            { $match: { submitted_by: req.user.user_id } },
            {
                $lookup: {
                    from: 'Complaint_types',
                    localField: 'complaint_type',
                    foreignField: 'complaint_type_id',
                    as: 'type_info',
                },
            },
            { $unwind: { path: '$type_info', preserveNullAndEmptyArrays: true } },
            { $sort: { complaint_date: -1 } },
            {
                $project: {
                    complaint_id: 1,
                    complaint_description: 1,
                    complaint_type: '$type_info.complaint_type',
                    status: 1,
                    complaint_date: 1,
                    address_detail: 1,
                    supporting_img: 1,
                },
            },
        ];

        const complaints = await Complaint.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data: complaints,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/complaints/:id/verify
 * Verify a complaint (barangay admin only)
 */
exports.verifyComplaint = async (req, res, next) => {
    try {
        const complaint_id = req.params.id;

        // Check if complaint exists and belongs to admin's barangay
        const complaint = await Complaint.findOne({ complaint_id });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found',
            });
        }

        // Verify barangay admin can only verify complaints from their barangay
        if (req.user.role_id === ROLES.BARANGAY_ADMIN && complaint.barangay_id !== req.user.barangay_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only verify complaints from your assigned barangay',
            });
        }

        // Update status to Verified
        const result = await Complaint.updateOne(
            { complaint_id },
            { $set: { status: 'Verified' } }
        );

        logger.info(`Complaint ${complaint_id} verified by user ${req.user.user_id}`);

        res.status(200).json({
            success: true,
            message: 'Complaint verified successfully',
            data: { complaint_id, status: 'Verified' },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/complaints/:id/reject
 * Reject a complaint (barangay admin only)
 */
exports.rejectComplaint = async (req, res, next) => {
    try {
        const complaint_id = req.params.id;

        // Check if complaint exists and belongs to admin's barangay
        const complaint = await Complaint.findOne({ complaint_id });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found',
            });
        }

        // Verify barangay admin can only reject complaints from their barangay
        if (req.user.role_id === ROLES.BARANGAY_ADMIN && complaint.barangay_id !== req.user.barangay_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only reject complaints from your assigned barangay',
            });
        }

        // Update status to Rejected
        const result = await Complaint.updateOne(
            { complaint_id },
            { $set: { status: 'Rejected' } }
        );

        logger.info(`Complaint ${complaint_id} rejected by user ${req.user.user_id}`);

        res.status(200).json({
            success: true,
            message: 'Complaint rejected successfully',
            data: { complaint_id, status: 'Rejected' },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/complaints/status
 * Update complaint status (enhanced for central admin full control)
 * Central Admin can update ANY complaint to ANY status including resolved complaints
 */
exports.updateComplaintStatus = async (req, res, next) => {
    try {
        const { complaint_id, status } = req.body;
        const role_id = req.user.role_id;

        // Normalize status to capitalize first letter
        const normalizeStatus = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

        let finalStatus;

        // CENTRAL ADMIN (role_id = 3): Full control over ALL statuses
        if (role_id === ROLES.CENTRAL_ADMIN) {
            const allowedStatuses = ['pending', 'unresolved', 'verified', 'resolved', 'rejected'];
            
            if (!allowedStatuses.includes(status.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`,
                });
            }
            
            finalStatus = normalizeStatus(status);
        } 
        // BARANGAY ADMIN (role_id = 2): Can only set to Verified or Rejected
        else if (role_id === ROLES.BARANGAY_ADMIN) {
            const allowed = ['verified', 'rejected'];
            
            if (!allowed.includes(status.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: 'Barangay Admin can only set status to Verified or Rejected.',
                });
            }
            
            finalStatus = normalizeStatus(status);
        } 
        else {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update complaint status.',
            });
        }

        const result = await Complaint.updateOne(
            { complaint_id },
            { $set: { status: finalStatus } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'No complaint found with that ID.',
            });
        }

        logger.info(`Complaint ${complaint_id} status updated to ${finalStatus} by user ${req.user.user_id}`);

        res.status(200).json({
            success: true,
            message: `Complaint status updated to ${finalStatus}`,
            rows_affected: result.modifiedCount,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/complaints/overview
 * Get complaint statistics for barangay admin dashboard
 * Converted from get_complaintsOverview.php
 */
exports.getComplaintsOverview = async (req, res, next) => {
    try {
        const barangay_id = req.user.barangay_id;

        if (!barangay_id) {
            return res.status(400).json({
                success: false,
                message: 'No barangay assigned to this account.',
            });
        }

        // Range filter
        const range = req.query.range || 'week';
        const now = new Date();
        let threshold;

        switch (range) {
            case 'month':
                threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                threshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default: // week
                threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
        }

        const baseFilter = {
            barangay_id: parseInt(barangay_id, 10),
            complaint_date: { $gte: threshold },
        };

        // Get counts using aggregation
        const stats = await Complaint.aggregate([
            { $match: baseFilter },
            {
                $group: {
                    _id: { $toLower: '$status' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const result = { verified: 0, resolved: 0, rejected: 0, pending: 0, unresolved: 0 };
        stats.forEach((s) => {
            if (result.hasOwnProperty(s._id)) {
                result[s._id] = s.count;
            }
        });

        // New pending within 24 hours
        const threshold24hrs = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const pendingNew = await Complaint.countDocuments({
            status: { $regex: /^pending$/i },
            barangay_id: parseInt(barangay_id, 10),
            complaint_date: { $gte: threshold24hrs },
        });

        result.pending_new = pendingNew;

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/complaints/recurring
 * Get recurring problems grouped by street and complaint type
 * Converted from get_recurringProblems.php
 */
exports.getRecurringProblems = async (req, res, next) => {
    try {
        const barangay_id = req.user.barangay_id;

        if (!barangay_id) {
            return res.status(400).json({
                success: false,
                message: 'No barangay assigned.',
            });
        }

        const pipeline = [
            { $match: { barangay_id: parseInt(barangay_id, 10) } },
            {
                $lookup: {
                    from: 'Streets',
                    localField: 'street_id',
                    foreignField: 'street_id',
                    as: 'street_info',
                },
            },
            {
                $lookup: {
                    from: 'Complaint_types',
                    localField: 'complaint_type',
                    foreignField: 'complaint_type_id',
                    as: 'type_info',
                },
            },
            { $unwind: '$street_info' },
            { $unwind: '$type_info' },
            {
                $group: {
                    _id: {
                        street_name: '$street_info.street_name',
                        complaint_type: '$type_info.complaint_type',
                    },
                    total: { $sum: 1 },
                },
            },
            { $sort: { total: -1, '_id.street_name': 1 } },
            {
                $project: {
                    _id: 0,
                    street_name: '$_id.street_name',
                    complaint_type: '$_id.complaint_type',
                    total: 1,
                },
            },
        ];

        const data = await Complaint.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
};
