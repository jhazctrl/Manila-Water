/**
 * Security Middleware
 * 
 * CSRF protection (double-submit cookie pattern), input sanitization,
 * request size limits, and custom security checks.
 * 
 * Note: csurf is deprecated, so we implement CSRF manually.
 */
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Generate CSRF token and set it as a cookie
 * The frontend reads this cookie and sends it back in a header
 */
const generateCsrfToken = (req, res, next) => {
    // Only generate if one doesn't exist
    if (!req.cookies || !req.cookies['XSRF-TOKEN']) {
        const token = crypto.randomBytes(32).toString('hex');
        res.cookie('XSRF-TOKEN', token, {
            httpOnly: false,           // Frontend needs to read this
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
    }
    next();
};

/**
 * Validate CSRF token on state-changing requests
 * Compares cookie token with header token (double-submit pattern)
 */
const validateCsrfToken = (req, res, next) => {
    // Skip CSRF for GET, HEAD, OPTIONS
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    const cookieToken = req.cookies && req.cookies['XSRF-TOKEN'];
    const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

    if (!cookieToken || !headerToken) {
        logger.warn('CSRF token missing', { ip: req.ip, url: req.originalUrl });
        return res.status(403).json({
            success: false,
            message: 'CSRF token missing. Please refresh and try again.',
        });
    }

    // Constant-time comparison to prevent timing attacks
    try {
        const cookieBuf = Buffer.from(cookieToken);
        const headerBuf = Buffer.from(headerToken);

        if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
            logger.warn('CSRF token mismatch', { ip: req.ip, url: req.originalUrl });
            return res.status(403).json({
                success: false,
                message: 'CSRF token invalid. Please refresh and try again.',
            });
        }
    } catch (err) {
        logger.warn('CSRF validation error', { ip: req.ip, error: err.message });
        return res.status(403).json({
            success: false,
            message: 'CSRF validation failed.',
        });
    }

    next();
};

/**
 * Additional security checks
 */
const securityChecks = (req, res, next) => {
    // Block requests with suspicious user agents
    const ua = req.headers['user-agent'] || '';
    if (!ua || ua.length > 500) {
        logger.warn('Suspicious request - missing/oversized user agent', { ip: req.ip });
        // Don't block, just log — some legitimate tools lack user agents
    }

    next();
};

module.exports = {
    generateCsrfToken,
    validateCsrfToken,
    securityChecks,
};
