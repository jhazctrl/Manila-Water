/**
 * File Upload Middleware (Multer)
 * 
 * Security: Validates file type and size for complaint image uploads
 * Only allows images (JPEG, PNG, GIF, WebP) up to 5MB
 */
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const securityConfig = require('../config/security');

// Storage configuration — saves to uploads/ with unique filenames
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', securityConfig.upload.uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename to prevent overwrites and path traversal
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `complaint_${uniqueSuffix}${ext}`);
    },
});

// File filter — only allow images
const fileFilter = (req, file, cb) => {
    if (securityConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: securityConfig.upload.maxFileSize,
        files: 1, // Max 1 file per request
    },
});

module.exports = upload;
