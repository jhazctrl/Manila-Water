/**
 * User Routes — Profile management
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/users/profile — Get profile (protected)
router.get('/profile', protect, userController.getUserProfile);

// PUT /api/users/profile — Update profile (protected, optional photo upload)
router.put('/profile', protect, upload.single('user_photo'), userController.updateProfile);

module.exports = router;
