/**
 * Authentication Controller
 * 
 * Handles: register, login, logout, getMe, changePassword
 * Security: Bcrypt hashing, JWT tokens, account lockout, rate limiting
 */
const User = require('../models/User');
const GuestUser = require('../models/GuestUser');
const securityConfig = require('../config/security');
const logger = require('../utils/logger');
const { sanitizeEmail } = require('../utils/sanitizer');

/**
 * POST /api/auth/register
 * Register a new user (Account Holder by default)
 */
exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, address, barangayId, streetId } = req.body;

        // Check if email already exists (Users or Guest_users)
        const existingUser = await User.findOne({ user_email: sanitizeEmail(email) });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email is already in use.',
            });
        }

        const existingGuest = await GuestUser.findOne({ guest_email: sanitizeEmail(email) });
        if (existingGuest) {
            return res.status(409).json({
                success: false,
                message: 'Email is already in use.',
            });
        }

        // Auto-increment user_id
        const lastUser = await User.findOne().sort({ user_id: -1 }).select('user_id');
        const newUserId = (lastUser ? lastUser.user_id : 0) + 1;

        // Create user — password is hashed by pre-save hook
        const user = await User.create({
            user_id: newUserId,
            role_id: 1, // Account Holder
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            address: address ? address.trim() : '',
            street_id: parseInt(streetId, 10),
            barangay_id: parseInt(barangayId, 10),
            user_email: sanitizeEmail(email),
            password,
        });

        // Generate JWT
        const token = user.generateAuthToken();

        // Set httpOnly cookie
        res.cookie(securityConfig.jwt.cookieName, token, securityConfig.jwt.cookieOptions);

        logger.info(`New user registered: ${user.user_email} (ID: ${user.user_id})`);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                user_email: user.user_email,
                role_id: user.role_id,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/login
 * Login with email and password
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user with password field (select: false by default)
        const user = await User.findOne({ user_email: sanitizeEmail(email) }).select('+password');

        if (!user) {
            // Generic message to prevent user enumeration (OWASP A07)
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            logger.warn(`Login attempt on locked account: ${user.user_email}`);
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            // Increment failed attempts
            await user.incrementLoginAttempts();

            logger.warn(`Failed login attempt for: ${user.user_email}`, { ip: req.ip });

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Generate JWT
        const token = user.generateAuthToken();

        // Set httpOnly cookie
        res.cookie(securityConfig.jwt.cookieName, token, securityConfig.jwt.cookieOptions);

        logger.info(`User logged in: ${user.user_email} (Role: ${user.role_id})`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                user_email: user.user_email,
                role_id: user.role_id,
                barangay_id: user.barangay_id,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/logout
 * Clear JWT cookie
 */
exports.logout = async (req, res, next) => {
    try {
        res.cookie(securityConfig.jwt.cookieName, '', {
            httpOnly: true,
            expires: new Date(0), // Expire immediately
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
exports.getMe = async (req, res, next) => {
    try {
        // req.user is attached by auth middleware (password excluded)
        const user = await User.findOne({ user_id: req.user.user_id });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
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
 * PUT /api/auth/change-password
 * Change password for authenticated user
 */
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password field
        const user = await User.findOne({ user_id: req.user.user_id }).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect.',
            });
        }

        // Update password — pre-save hook will hash it
        user.password = newPassword;
        await user.save();

        // Generate new token (invalidates old one since JWT content changes)
        const token = user.generateAuthToken();
        res.cookie(securityConfig.jwt.cookieName, token, securityConfig.jwt.cookieOptions);

        logger.info(`Password changed for user: ${user.user_email}`);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        next(error);
    }
};
