/**
 * Main API Router
 * 
 * Mounts all sub-routers and provides health check endpoint
 * Converted from: test_connection.php
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Mount sub-routers
router.use('/auth', require('./auth'));
router.use('/complaints', require('./complaints'));
router.use('/advisories', require('./advisories'));
router.use('/locations', require('./locations'));
router.use('/users', require('./users'));
router.use('/email', require('./email'));

// GET /api/test-connection — Health check (converted from test_connection.php)
router.get('/test-connection', async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const stateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

        if (dbState !== 1) {
            return res.status(503).json({
                success: false,
                message: `Database is ${stateNames[dbState] || 'unknown'}`,
            });
        }

        // Get collection counts
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map((c) => c.name);

        res.status(200).json({
            success: true,
            message: 'API is running and MongoDB is connected',
            data: {
                database: mongoose.connection.name,
                state: stateNames[dbState],
                collections: collectionNames.length,
                collectionList: collectionNames,
                serverTime: new Date().toISOString(),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

module.exports = router;
