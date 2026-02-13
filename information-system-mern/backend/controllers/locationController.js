/**
 * Location Controller
 * 
 * Handles: getBarangays, getStreets, getStreetsByBarangay
 * Converted from: get_barangays.php, get_streets.php, get_locations.php
 */
const Barangay = require('../models/Barangay');
const Street = require('../models/Street');

/**
 * GET /api/locations/barangays
 * Get all barangays
 */
exports.getBarangays = async (req, res, next) => {
    try {
        const barangays = await Barangay.find().sort({ brgy_id: 1 }).lean();

        res.status(200).json({
            success: true,
            data: barangays,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/locations/streets
 * Get all streets (optionally filtered by brgy_id query param)
 */
exports.getStreets = async (req, res, next) => {
    try {
        const filter = {};

        if (req.query.brgy_id) {
            filter.brgy_id = parseInt(req.query.brgy_id, 10);
        }

        const streets = await Street.find(filter).sort({ street_name: 1 }).lean();

        res.status(200).json({
            success: true,
            data: streets,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/locations/streets/:brgyId
 * Get streets for a specific barangay
 */
exports.getStreetsByBarangay = async (req, res, next) => {
    try {
        const brgyId = parseInt(req.params.brgyId, 10);

        if (isNaN(brgyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid barangay ID.',
            });
        }

        const streets = await Street.find({ brgy_id: brgyId }).sort({ street_name: 1 }).lean();

        res.status(200).json({
            success: true,
            data: streets,
        });
    } catch (error) {
        next(error);
    }
};
