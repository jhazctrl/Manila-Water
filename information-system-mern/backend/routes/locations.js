/**
 * Location Routes — public (no auth needed for dropdowns)
 */
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// GET /api/locations/barangays
router.get('/barangays', locationController.getBarangays);

// GET /api/locations/streets  (optional ?brgy_id=N filter)
router.get('/streets', locationController.getStreets);

// GET /api/locations/streets/:brgyId
router.get('/streets/:brgyId', locationController.getStreetsByBarangay);

module.exports = router;
