/**
 * Input Sanitization Utilities
 * 
 * Security: OWASP A03:2021 – Injection prevention
 * Strips HTML, escapes special chars, prevents XSS
 */
const validator = require('validator');

/**
 * Remove HTML tags from string
 */
const stripHtml = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '');
};

/**
 * Escape HTML special characters to prevent XSS
 */
const escapeHtml = (str) => {
    if (typeof str !== 'string') return str;
    return validator.escape(str);
};

/**
 * Trim and normalize whitespace
 */
const normalizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/\s+/g, ' ');
};

/**
 * Sanitize an object's string values recursively
 */
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        return normalizeInput(stripHtml(obj));
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
};

/**
 * Sanitize email — lowercase, trim
 */
const sanitizeEmail = (email) => {
    if (typeof email !== 'string') return '';
    return validator.normalizeEmail(email.trim().toLowerCase()) || '';
};

module.exports = {
    stripHtml,
    escapeHtml,
    normalizeInput,
    sanitizeObject,
    sanitizeEmail,
};
