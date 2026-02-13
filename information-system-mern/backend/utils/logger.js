/**
 * Winston Logger Configuration
 * 
 * Security: OWASP A09:2021 – Security Logging and Monitoring
 * - Logs to console in development, file in production
 * - Never logs sensitive data (passwords, tokens, etc.)
 */
const winston = require('winston');
const path = require('path');

// Custom format to strip sensitive fields
const sanitizeFormat = winston.format((info) => {
    // Remove sensitive data from log messages
    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'cookie'];
    if (typeof info.message === 'string') {
        sensitiveFields.forEach((field) => {
            const regex = new RegExp(`(${field})[=:]["']?\\S+`, 'gi');
            info.message = info.message.replace(regex, `$1=[REDACTED]`);
        });
    }
    return info;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        sanitizeFormat(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'mnl-water-api' },
    transports: [],
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, stack }) => {
                    return `${timestamp} ${level}: ${stack || message}`;
                })
            ),
        })
    );
} else {
    // File transports for production
    const logsDir = path.join(__dirname, '..', 'logs');

    logger.add(
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
    logger.add(
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        })
    );
    // Also log to console in production for Docker/PM2 log capture
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
        })
    );
}

module.exports = logger;
