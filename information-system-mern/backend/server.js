/**
 * Manila Water Sampaloc — MERN Backend Server
 * 
 * Production-ready Express server with comprehensive security middleware.
 * 
 * Security Features (OWASP Top 10):
 * - A01: Role-based access control via auth middleware
 * - A02: bcrypt password hashing, JWT tokens, httpOnly cookies
 * - A03: Input validation (express-validator), NoSQL injection prevention (mongo-sanitize)
 * - A05: Helmet security headers, env-based config, X-Powered-By disabled
 * - A07: Account lockout, rate limiting, strong password enforcement
 * - A08: CSRF double-submit cookie pattern
 * - A09: Winston structured logging with sensitive data redaction
 * - A10: CORS allowlist, no external requests
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Config & Utils
const connectDB = require('./config/db');
const securityConfig = require('./config/security');
const logger = require('./utils/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const { generateCsrfToken, validateCsrfToken, securityChecks } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');

// Import API router
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────────────
// 1. SECURITY MIDDLEWARE
// ──────────────────────────────────────────────

// Helmet — Security headers (A05)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'blob:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
            },
        },
        crossOriginEmbedderPolicy: false, // Allow image loading
        crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow CORS for uploaded images
    })
);

// Remove X-Powered-By header (A05)
app.disable('x-powered-by');

// CORS (A05 — restrict origins)
app.use(cors(securityConfig.cors));

// Rate limiting — general (A07)
app.use('/api', generalLimiter);

// NoSQL injection prevention (A03)
app.use(mongoSanitize());

// HTTP Parameter Pollution protection
app.use(hpp());

// Compression
app.use(compression());

// ──────────────────────────────────────────────
// 2. BODY PARSING & COOKIES
// ──────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ──────────────────────────────────────────────
// 3. CSRF PROTECTION (A08)
// ──────────────────────────────────────────────

// CSRF protection — disabled in development (Vite proxy doesn't forward cookies properly)
if (process.env.NODE_ENV === 'production') {
    app.use(generateCsrfToken);
    app.use('/api', validateCsrfToken);
} else {
    logger.info('CSRF protection disabled in development mode');
}

// ──────────────────────────────────────────────
// 4. SECURITY CHECKS
// ──────────────────────────────────────────────

app.use(securityChecks);

// ──────────────────────────────────────────────
// 5. REQUEST LOGGING (A09)
// ──────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // Stream Morgan logs to Winston in production
    const morganStream = {
        write: (message) => logger.info(message.trim()),
    };
    app.use(morgan('combined', { stream: morganStream }));
}

// ──────────────────────────────────────────────
// 6. STATIC FILES (uploaded images)
// ──────────────────────────────────────────────

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ──────────────────────────────────────────────
// 7. ROUTES
// ──────────────────────────────────────────────

app.use('/api', apiRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Manila Water Sampaloc API — MERN Backend',
        version: '1.0.0',
        docs: '/api/test-connection',
    });
});

// 404 handler for unmatched routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// ──────────────────────────────────────────────
// 8. ERROR HANDLING MIDDLEWARE (must be last)
// ──────────────────────────────────────────────

app.use(errorHandler);

// ──────────────────────────────────────────────
// 9. DATABASE CONNECTION & SERVER START
// ──────────────────────────────────────────────

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        const server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            logger.info(`API available at http://localhost:${PORT}/api`);
            logger.info(`Health check: http://localhost:${PORT}/api/test-connection`);
        });

        // ──────────────────────────────────────────
        // 10. GRACEFUL SHUTDOWN
        // ──────────────────────────────────────────

        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);

            server.close(async () => {
                logger.info('HTTP server closed');

                try {
                    await mongoose.connection.close();
                    logger.info('MongoDB connection closed');
                } catch (err) {
                    logger.error('Error closing MongoDB connection:', err);
                }

                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            logger.error('Unhandled Promise Rejection:', err);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app; // For testing
