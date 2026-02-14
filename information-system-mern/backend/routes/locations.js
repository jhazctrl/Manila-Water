/**
 * Location Routes
 * Provides endpoints for fetching barangays and streets
 */
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// GET /api/locations/barangays - Get all barangays
router.get('/barangays', locationController.getBarangays);

// GET /api/locations/barangays/:brgyId/streets - Get streets by barangay
router.get('/barangays/:brgyId/streets', locationController.getStreetsByBarangay);

// GET /api/locations/streets - Get all streets (optionally filtered by query param)
router.get('/streets', locationController.getStreets);

module.exports = router;
