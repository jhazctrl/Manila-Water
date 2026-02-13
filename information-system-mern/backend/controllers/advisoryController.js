/**
 * Advisory Controller
 * 
 * Handles: create, getActive, getAll, resolve, setOngoing
 * Converted from: save_advisory.php, get_advisories.php, resolve_advisory.php, ongoing_advisory.php
 */
const Advisory = require('../models/Advisory');
const { ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * POST /api/advisories
 * Create a new advisory (admin only)
 */
exports.createAdvisory = async (req, res, next) => {
    try {
        const {
            advisory_type_id, advisory_description,
            start_date, start_time, end_date, end_time,
            brgy_id, street_id, status,
        } = req.body;

        // Validate start < end
        const startDT = new Date(`${start_date}T${start_time}`);
        const endDT = new Date(`${end_date}T${end_time}`);

        if (endDT <= startDT) {
            return res.status(400).json({
                success: false,
                message: 'End date/time must be after start date/time.',
            });
        }

        // Auto-increment advisory_id
        const lastAdvisory = await Advisory.findOne().sort({ advisory_id: -1 }).select('advisory_id');
        const newAdvisoryId = (lastAdvisory ? lastAdvisory.advisory_id : 0) + 1;

        // Normalize time format (ensure HH:MM:SS)
        const formatTime = (t) => {
            const parts = t.split(':');
            if (parts.length === 2) parts.push('00');
            return parts.map((p) => p.padStart(2, '0')).join(':');
        };

        const advisory = await Advisory.create({
            advisory_id: newAdvisoryId,
            advisory_type_id: parseInt(advisory_type_id, 10),
            advisory_description: advisory_description.trim(),
            start_date,
            start_time: formatTime(start_time),
            end_date,
            end_time: formatTime(end_time),
            status: status || 'upcoming',
            street_id: parseInt(street_id, 10),
            brgy_id: parseInt(brgy_id, 10),
        });

        logger.info(`Advisory created: ID ${newAdvisoryId} by user ${req.user.user_id}`);

        res.status(201).json({
            success: true,
            message: 'Advisory created successfully',
            data: { advisory_id: newAdvisoryId },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/advisories
 * Get active advisories (ongoing + upcoming) with lookups
 * Converted from get_advisories.php
 */
exports.getAdvisories = async (req, res, next) => {
    try {
        const filter = {
            status: { $regex: /^(ongoing|upcoming)$/i },
        };

        // Barangay admin sees only their barangay (req.user may be null for public route)
        if (req.user && req.user.role_id === ROLES.BARANGAY_ADMIN && req.user.barangay_id) {
            filter.brgy_id = parseInt(req.user.barangay_id, 10);
        }

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'Advisory_types',
                    localField: 'advisory_type_id',
                    foreignField: 'advisory_type_id',
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
                    localField: 'brgy_id',
                    foreignField: 'brgy_id',
                    as: 'barangay_info',
                },
            },
            { $unwind: { path: '$type_info', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$street_info', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$barangay_info', preserveNullAndEmptyArrays: true } },
            { $sort: { start_date: -1 } },
            {
                $project: {
                    advisory_id: 1,
                    advisory_type: '$type_info.advisory_type',
                    advisory_description: 1,
                    start_date: 1,
                    start_time: 1,
                    end_date: 1,
                    end_time: 1,
                    status: 1,
                    street_name: '$street_info.street_name',
                    brgy_number: '$barangay_info.brgy_number',
                },
            },
        ];

        const advisories = await Advisory.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data: advisories,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/advisories/all
 * Get all advisories (for dashboard tables, includes resolved)
 */
exports.getAllAdvisories = async (req, res, next) => {
    try {
        const filter = {};

        if (req.user.role_id === ROLES.BARANGAY_ADMIN && req.user.barangay_id) {
            filter.brgy_id = parseInt(req.user.barangay_id, 10);
        }

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'Advisory_types',
                    localField: 'advisory_type_id',
                    foreignField: 'advisory_type_id',
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
                    localField: 'brgy_id',
                    foreignField: 'brgy_id',
                    as: 'barangay_info',
                },
            },
            { $unwind: { path: '$type_info', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$street_info', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$barangay_info', preserveNullAndEmptyArrays: true } },
            { $sort: { created_at: -1 } },
            {
                $project: {
                    advisory_id: 1,
                    advisory_type: '$type_info.advisory_type',
                    advisory_description: 1,
                    start_date: 1,
                    start_time: 1,
                    end_date: 1,
                    end_time: 1,
                    status: 1,
                    street_name: '$street_info.street_name',
                    brgy_number: '$barangay_info.brgy_number',
                    created_at: 1,
                },
            },
        ];

        const advisories = await Advisory.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data: advisories,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/advisories/:id/resolve
 * Set advisory status to Resolved
 */
exports.resolveAdvisory = async (req, res, next) => {
    try {
        const advisoryId = parseInt(req.params.id, 10);

        const result = await Advisory.updateOne(
            { advisory_id: advisoryId },
            { $set: { status: 'Resolved' } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Advisory not found.',
            });
        }

        logger.info(`Advisory ${advisoryId} resolved by user ${req.user.user_id}`);

        res.status(200).json({
            success: true,
            message: 'Advisory resolved successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/advisories/:id/ongoing
 * Set advisory status to ongoing
 */
exports.setOngoingAdvisory = async (req, res, next) => {
    try {
        const advisoryId = parseInt(req.params.id, 10);

        const result = await Advisory.updateOne(
            { advisory_id: advisoryId },
            { $set: { status: 'ongoing' } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Advisory not found.',
            });
        }

        logger.info(`Advisory ${advisoryId} set to ongoing by user ${req.user.user_id}`);

        res.status(200).json({
            success: true,
            message: 'Advisory status set to ongoing.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/advisories/stats
 * Get advisory statistics (central admin only)
 */
exports.getAdvisoryStats = async (req, res, next) => {
    try {
        const stats = await Advisory.aggregate([
            {
                $group: {
                    _id: { $toLower: '$status' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const total = await Advisory.countDocuments();

        const result = {
            total,
            upcoming: 0,
            ongoing: 0,
            resolved: 0,
        };

        stats.forEach((s) => {
            if (s._id === 'upcoming') result.upcoming = s.count;
            else if (s._id === 'ongoing') result.ongoing = s.count;
            else if (s._id === 'resolved') result.resolved = s.count;
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
