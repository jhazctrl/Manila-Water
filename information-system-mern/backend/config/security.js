/**
 * Centralized Security Configuration
 * All security-related settings in one place
 * 
 * OWASP: A05:2021 – Security Misconfiguration prevention
 */
module.exports = {
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION',
        expire: process.env.JWT_EXPIRE || '7d',
        cookieName: 'mnl_water_token',
        cookieOptions: {
            httpOnly: true,                                         // Prevent XSS access to cookie
            secure: process.env.NODE_ENV === 'production',          // HTTPS only in production
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000,                       // 7 days in ms
            path: '/',
        },
    },

    // Bcrypt Configuration
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
    },

    // Rate Limiting Configurations
    rateLimit: {
        general: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
            message: {
                success: false,
                message: 'Too many requests from this IP, please try again after 15 minutes.',
            },
            standardHeaders: true,
            legacyHeaders: false,
        },
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5,                    // 5 attempts per window
            message: {
                success: false,
                message: 'Too many login attempts. Please try again after 15 minutes.',
            },
            standardHeaders: true,
            legacyHeaders: false,
        },
        passwordReset: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3,
            message: {
                success: false,
                message: 'Too many password reset attempts. Please try again after 1 hour.',
            },
            standardHeaders: true,
            legacyHeaders: false,
        },
    },

    // CORS Configuration
    cors: {
        origin: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
            : ['http://localhost:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        exposedHeaders: ['X-CSRF-Token'],
        maxAge: 86400, // 24 hours
    },

    // Account Lockout
    lockout: {
        maxAttempts: 5,
        lockDurationMs: 30 * 60 * 1000, // 30 minutes
    },

    // File Upload
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        uploadDir: process.env.UPLOAD_DIR || 'uploads',
    },
};
