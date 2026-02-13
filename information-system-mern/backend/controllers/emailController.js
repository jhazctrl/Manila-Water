/**
 * Email Subscription Controller
 * 
 * Handles: subscribe (guest users), getSubscribers (admin)
 * Converted from: email_subscription.php, email.php
 */
const GuestUser = require('../models/GuestUser');
const Street = require('../models/Street');
const Barangay = require('../models/Barangay');
const logger = require('../utils/logger');
const { sanitizeEmail } = require('../utils/sanitizer');

/**
 * POST /api/email/subscribe
 * Subscribe a guest email for advisory notifications (public)
 */
exports.subscribe = async (req, res, next) => {
    try {
        const { email, street_id, barangay_id } = req.body;
        const normalizedEmail = sanitizeEmail(email);

        // Check if email already exists
        const existing = await GuestUser.findOne({ guest_email: normalizedEmail });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Email is already subscribed.',
            });
        }

        // Validate location IDs exist
        const street = await Street.findOne({ street_id: parseInt(street_id, 10) });
        if (!street) {
            return res.status(400).json({
                success: false,
                message: `Invalid street selection (ID: ${street_id})`,
            });
        }

        const barangay = await Barangay.findOne({ brgy_id: parseInt(barangay_id, 10) });
        if (!barangay) {
            return res.status(400).json({
                success: false,
                message: `Invalid barangay selection (ID: ${barangay_id})`,
            });
        }

        // Auto-increment guest_user_id
        const lastGuest = await GuestUser.findOne().sort({ guest_user_id: -1 }).select('guest_user_id');
        const nextGuestId = (lastGuest ? lastGuest.guest_user_id : 0) + 1;

        await GuestUser.create({
            guest_user_id: nextGuestId,
            guest_email: normalizedEmail,
            brgy_id: parseInt(barangay_id, 10),
            street_id: parseInt(street_id, 10),
        });

        logger.info(`New email subscription: ${normalizedEmail} (Guest ID: ${nextGuestId})`);

        res.status(200).json({
            success: true,
            message: 'Subscription successful! You will receive water interruption advisories for your area.',
            data: {
                email: normalizedEmail,
                guest_id: nextGuestId,
                location: `${street.street_name}, ${barangay.brgy_number}`,
            },
        });
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email is already subscribed.',
            });
        }
        next(error);
    }
};

/**
 * GET /api/email/subscribers
 * Get all email subscribers with location info (admin only)
 */
exports.getSubscribers = async (req, res, next) => {
    try {
        const pipeline = [
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
            { $unwind: { path: '$street_info', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$barangay_info', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    guest_user_id: 1,
                    guest_email: 1,
                    full_location: {
                        $concat: [
                            { $ifNull: ['$street_info.street_name', 'N/A'] },
                            ', ',
                            { $ifNull: ['$barangay_info.brgy_number', 'N/A'] },
                        ],
                    },
                },
            },
            { $sort: { guest_user_id: -1 } },
        ];

        const subscribers = await GuestUser.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data: {
                emails: subscribers,
                count: subscribers.length,
            },
        });
    } catch (error) {
        next(error);
    }
};
