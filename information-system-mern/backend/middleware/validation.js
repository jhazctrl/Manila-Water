/**
 * Input Validation Middleware
 * 
 * Security: OWASP A03 – Injection prevention via express-validator rules
 * Provides reusable validation chains for each endpoint
 */
const { body, param, query, validationResult } = require('express-validator');

/**
 * Process validation results — returns 400 with errors if validation fails
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
            })),
        });
    }
    next();
};

/**
 * Registration validation rules
 */
const registerRules = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 1, max: 100 }).withMessage('First name must be 1-100 characters')
        .matches(/^[a-zA-ZÀ-ÿ\s.\-']+$/).withMessage('First name contains invalid characters'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 1, max: 100 }).withMessage('Last name must be 1-100 characters')
        .matches(/^[a-zA-ZÀ-ÿ\s.\-']+$/).withMessage('Last name contains invalid characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .isStrongPassword({
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        }).withMessage('Password must contain uppercase, lowercase, number, and special character'),

    body('barangayId')
        .notEmpty().withMessage('Barangay is required')
        .isInt({ min: 1 }).withMessage('Invalid barangay selection'),

    body('streetId')
        .notEmpty().withMessage('Street is required')
        .isInt({ min: 1 }).withMessage('Invalid street selection'),

    body('address')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Address must not exceed 255 characters'),
];

/**
 * Login validation rules
 */
const loginRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),
];

/**
 * Change password validation rules
 */
const changePasswordRules = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .isStrongPassword({
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        }).withMessage('New password must contain uppercase, lowercase, number, and special character'),
];

/**
 * Complaint submission validation rules
 */
const complaintRules = [
    body('contact_no')
        .notEmpty().withMessage('Contact number is required')
        .matches(/^(\+?63|0)?9\d{9}$/).withMessage('Invalid Philippine phone number'),

    body('address_detail')
        .trim()
        .notEmpty().withMessage('Address detail is required')
        .isLength({ max: 255 }).withMessage('Address must not exceed 255 characters'),

    body('brgy_id')
        .notEmpty().withMessage('Barangay is required')
        .isInt({ min: 1 }).withMessage('Invalid barangay'),

    body('street_id')
        .notEmpty().withMessage('Street is required')
        .isInt({ min: 1 }).withMessage('Invalid street'),

    body('complaint_type')
        .notEmpty().withMessage('Complaint type is required')
        .isInt({ min: 1, max: 5 }).withMessage('Invalid complaint type'),

    body('complaint_duration')
        .notEmpty().withMessage('Complaint duration is required')
        .isInt({ min: 1, max: 5 }).withMessage('Invalid complaint duration'),

    body('complaint_description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
];

/**
 * Advisory creation validation rules
 */
const advisoryRules = [
    body('advisory_type_id')
        .notEmpty().withMessage('Advisory type is required')
        .isInt().withMessage('Invalid advisory type'),

    body('advisory_description')
        .trim()
        .notEmpty().withMessage('Advisory description is required')
        .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),

    body('start_date')
        .notEmpty().withMessage('Start date is required')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('Invalid start date format'),

    body('start_time')
        .notEmpty().withMessage('Start time is required')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage('Invalid start time format'),

    body('end_date')
        .notEmpty().withMessage('End date is required')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('Invalid end date format'),

    body('end_time')
        .notEmpty().withMessage('End time is required')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).withMessage('Invalid end time format'),

    body('brgy_id')
        .notEmpty().withMessage('Barangay is required')
        .isInt({ min: 1 }).withMessage('Invalid barangay'),

    body('street_id')
        .notEmpty().withMessage('Street is required')
        .isInt({ min: 1 }).withMessage('Invalid street'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['upcoming', 'ongoing', 'Resolved', 'Upcoming', 'Ongoing', 'resolved'])
        .withMessage('Invalid status'),
];

/**
 * Status update validation
 */
const statusUpdateRules = [
    body('complaint_id')
        .notEmpty().withMessage('Complaint ID is required')
        .matches(/^MWC-\d{4}-\d{2}-\d{5}$/).withMessage('Invalid complaint ID format'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['Verified', 'Rejected', 'Resolved', 'verified', 'rejected', 'resolved'])
        .withMessage('Invalid status'),
];

/**
 * Email subscription validation
 */
const emailSubscriptionRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('street_id')
        .notEmpty().withMessage('Street is required')
        .isInt({ min: 1 }).withMessage('Invalid street'),

    body('barangay_id')
        .notEmpty().withMessage('Barangay is required')
        .isInt({ min: 1 }).withMessage('Invalid barangay'),
];

module.exports = {
    validate,
    registerRules,
    loginRules,
    changePasswordRules,
    complaintRules,
    advisoryRules,
    statusUpdateRules,
    emailSubscriptionRules,
};
