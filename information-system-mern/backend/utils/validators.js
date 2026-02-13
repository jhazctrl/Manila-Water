/**
 * Custom Validators
 * 
 * Reusable validation functions for various input types
 */
const validator = require('validator');

/**
 * Validate strong password
 * Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
const isStrongPassword = (password) => {
    if (typeof password !== 'string') return false;
    return validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    });
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    if (typeof email !== 'string') return false;
    return validator.isEmail(email);
};

/**
 * Validate Philippine phone number
 * Accepts 09XX format or +639XX format, 10-13 digits
 */
const isValidPhone = (phone) => {
    if (!phone) return true; // Phone is optional in this app
    const phoneStr = String(phone).replace(/\s+/g, '');
    return /^(\+?63|0)?9\d{9}$/.test(phoneStr);
};

/**
 * Validate name (letters, spaces, hyphens, periods only)
 */
const isValidName = (name) => {
    if (typeof name !== 'string') return false;
    return /^[a-zA-ZÀ-ÿ\s.\-']{1,100}$/.test(name.trim());
};

/**
 * Validate complaint ID format: MWC-YYYY-MM-NNNNN
 */
const isValidComplaintId = (id) => {
    if (typeof id !== 'string') return false;
    return /^MWC-\d{4}-\d{2}-\d{5}$/.test(id);
};

/**
 * Validate date string (YYYY-MM-DD)
 */
const isValidDate = (dateStr) => {
    if (typeof dateStr !== 'string') return false;
    return validator.isDate(dateStr, { format: 'YYYY-MM-DD' });
};

/**
 * Validate time string (HH:MM or HH:MM:SS)
 */
const isValidTime = (timeStr) => {
    if (typeof timeStr !== 'string') return false;
    return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(timeStr);
};

/**
 * Password strength descriptor for frontend display
 */
const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: 'None' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return {
        score: Math.min(score, 5),
        label: labels[Math.min(score, 5)] || 'Very Weak',
    };
};

module.exports = {
    isStrongPassword,
    isValidEmail,
    isValidPhone,
    isValidName,
    isValidComplaintId,
    isValidDate,
    isValidTime,
    getPasswordStrength,
};
