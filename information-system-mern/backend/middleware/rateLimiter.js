/**
 * Rate Limiter Middleware
 * 
 * Security: OWASP A07 – Prevents brute-force attacks
 * Different limits for general API, auth endpoints, and password reset
 */
const rateLimit = require('express-rate-limit');
const securityConfig = require('../config/security');

// General API rate limiter — 100 requests per 15 minutes
const generalLimiter = rateLimit(securityConfig.rateLimit.general);

// Auth endpoints rate limiter — 5 requests per 15 minutes (stricter)
const authLimiter = rateLimit(securityConfig.rateLimit.auth);

// Password reset rate limiter — 3 requests per hour
const passwordResetLimiter = rateLimit(securityConfig.rateLimit.passwordReset);

module.exports = {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
};
