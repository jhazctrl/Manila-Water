/**
 * Security Tests
 * 
 * Basic tests to verify security middleware is working
 * Run with: npm test
 */

// These tests require the server to NOT be running (they start their own instance)
// For a real test suite, you'd use supertest, but here we verify key security functions

const { isStrongPassword, isValidEmail, isValidPhone } = require('../utils/validators');
const { sanitizeEmail, stripHtml, escapeHtml } = require('../utils/sanitizer');

describe('Input Validators', () => {
    test('should reject weak passwords', () => {
        expect(isStrongPassword('password')).toBe(false);
        expect(isStrongPassword('12345678')).toBe(false);
        expect(isStrongPassword('Password')).toBe(false);
        expect(isStrongPassword('Password1')).toBe(false);
    });

    test('should accept strong passwords', () => {
        expect(isStrongPassword('P@ssw0rd!')).toBe(true);
        expect(isStrongPassword('MyStr0ng!Pass')).toBe(true);
    });

    test('should validate email format', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user@mail.co')).toBe(true);
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('test@')).toBe(false);
        expect(isValidEmail('')).toBe(false);
    });

    test('should validate Philippine phone numbers', () => {
        expect(isValidPhone('09171234567')).toBe(true);
        expect(isValidPhone('+639171234567')).toBe(true);
        expect(isValidPhone('639171234567')).toBe(true);
        expect(isValidPhone('1234567')).toBe(false);
        expect(isValidPhone(null)).toBe(true); // Phone is optional
    });
});

describe('Input Sanitizer', () => {
    test('should strip HTML tags', () => {
        expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
        expect(stripHtml('<b>bold</b>')).toBe('bold');
        expect(stripHtml('no tags')).toBe('no tags');
    });

    test('should escape HTML special chars', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
        expect(escapeHtml('"quotes"')).toBe('&quot;quotes&quot;');
        expect(escapeHtml("it's")).toBe("it&#x27;s");
    });

    test('should sanitize email', () => {
        expect(sanitizeEmail('  Test@EXAMPLE.COM  ')).toBe('test@example.com');
        expect(sanitizeEmail('USER@gmail.com')).toBe('user@gmail.com');
    });

    test('should handle non-string inputs', () => {
        expect(stripHtml(123)).toBe(123);
        expect(stripHtml(null)).toBe(null);
        expect(escapeHtml(undefined)).toBe(undefined);
    });
});

describe('Security Configuration', () => {
    test('JWT secret should not be default in production', () => {
        const config = require('../config/security');
        // In development, any value is ok, but warn if using default
        if (process.env.NODE_ENV === 'production') {
            expect(config.jwt.secret).not.toBe('CHANGE_THIS_IN_PRODUCTION');
        }
    });

    test('bcrypt rounds should be >= 10', () => {
        const config = require('../config/security');
        expect(config.bcrypt.saltRounds).toBeGreaterThanOrEqual(10);
    });

    test('cookie should be httpOnly', () => {
        const config = require('../config/security');
        expect(config.jwt.cookieOptions.httpOnly).toBe(true);
    });

    test('rate limit should be configured', () => {
        const config = require('../config/security');
        expect(config.rateLimit.auth.max).toBeLessThanOrEqual(10);
        expect(config.rateLimit.general.max).toBeLessThanOrEqual(200);
    });
});
