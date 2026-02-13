/**
 * JWT Authentication Middleware
 * 
 * Security: OWASP A07 – Identification and Authentication Failures
 * - Verifies JWT from httpOnly cookie or Authorization header
 * - Attaches user to request object
 * - Role-based authorization support
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const securityConfig = require('../config/security');

/**
 * Protect routes — requires valid JWT
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // 1. Check httpOnly cookie first (preferred)
        if (req.cookies && req.cookies[securityConfig.jwt.cookieName]) {
            token = req.cookies[securityConfig.jwt.cookieName];
        }
        // 2. Fallback to Authorization header (Bearer token)
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, securityConfig.jwt.secret);

        // Find user and attach to request (exclude password)
        const user = await User.findOne({ user_id: decoded.id }).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User associated with this token no longer exists.',
            });
        }

        // Check if account is active
        if (user.isActive === false) {
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated.',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.warn(`Auth middleware error: ${error.message}`, { ip: req.ip });

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again.',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Not authorized. Invalid token.',
        });
    }
};

/**
 * Authorize by role — must be used AFTER protect middleware
 * @param  {...Number} roles - Allowed role IDs (1, 2, 3)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized.',
            });
        }

        if (!roles.includes(req.user.role_id)) {
            logger.warn(`Unauthorized access attempt by user ${req.user.user_id} (role: ${req.user.role_id})`, {
                requiredRoles: roles,
                url: req.originalUrl,
            });

            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource.',
            });
        }

        next();
    };
};

module.exports = { protect, authorize };
