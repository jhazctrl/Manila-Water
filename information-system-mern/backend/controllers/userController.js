/**
 * User Controller
 * 
 * Handles: getUserProfile, updateProfile
 * Converted from: get_userInfo.php, update_profile.php
 */
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * GET /api/users/profile
 * Get current user profile with street/barangay lookups
 * Converted from get_userInfo.php aggregation
 */
exports.getUserProfile = async (req, res, next) => {
    try {
        const pipeline = [
            { $match: { user_id: req.user.user_id } },
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
                    as: 'brgy_info',
                },
            },
            { $unwind: { path: '$street_info', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$brgy_info', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    user_id: 1,
                    first_name: 1,
                    last_name: 1,
                    user_email: 1,
                    contact_no: 1,
                    address: 1,
                    role_id: 1,
                    user_photo: 1,
                    street_id: 1,
                    barangay_id: 1,
                    street_name: '$street_info.street_name',
                    brgy_number: '$brgy_info.brgy_number',
                    created_at: 1,
                },
            },
        ];

        const result = await User.aggregate(pipeline);
        const user = result[0];

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/users/profile
 * Update user profile (converted from update_profile.php to MongoDB)
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const updateFields = {};

        // Only update provided fields
        const allowedFields = ['first_name', 'last_name', 'user_email', 'contact_no', 'address', 'street_id', 'barangay_id'];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        });

        // Handle profile photo upload
        if (req.file) {
            updateFields.user_photo = `/uploads/${req.file.filename}`;
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update.',
            });
        }

        // If email is being updated, check for duplicates
        if (updateFields.user_email) {
            const existing = await User.findOne({
                user_email: updateFields.user_email,
                user_id: { $ne: req.user.user_id },
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Email is already in use.',
                });
            }
        }

        const result = await User.updateOne(
            { user_id: req.user.user_id },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        logger.info(`Profile updated for user ${req.user.user_id}`);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
        });
    } catch (error) {
        next(error);
    }
};
