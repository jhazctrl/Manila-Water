/**
 * User Model — Mongoose Schema
 * 
 * Security: OWASP A02 (bcrypt hashing), A07 (account lockout)
 * Matches existing MongoDB Users collection structure
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const securityConfig = require('../config/security');

const userSchema = new mongoose.Schema(
    {
        user_id: {
            type: Number,
            required: true,
            unique: true,
            index: true,
        },
        role_id: {
            type: Number,
            required: true,
            enum: [1, 2, 3], // 1=Account Holder, 2=Barangay Admin, 3=Central Admin
            default: 1,
        },
        first_name: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: [100, 'First name cannot exceed 100 characters'],
        },
        last_name: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: [100, 'Last name cannot exceed 100 characters'],
        },
        address: {
            type: String,
            trim: true,
            maxlength: [255, 'Address cannot exceed 255 characters'],
        },
        street_id: {
            type: Number,
            required: true,
        },
        barangay_id: {
            type: Number,
            required: true,
        },
        user_email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        contact_no: {
            type: Number,
            default: null,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Never return password in queries by default
        },
        user_photo: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        loginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
            default: null,
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false, // Using created_at manually to match existing data
        collection: 'Users', // Match existing collection name
    }
);

// Note: Index for user_email is automatically created by unique: true in schema

/**
 * Virtual: Check if account is currently locked
 */
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Pre-save: Hash password if modified
 * Security: OWASP A02 – Uses bcrypt with configurable salt rounds
 */
userSchema.pre('save', async function (next) {
    // Only hash if password was modified
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(securityConfig.bcrypt.saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Compare candidate password with stored hash
 * Uses bcrypt.compare which is timing-safe
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    // Normalize PHP bcrypt prefix ($2y$) to Node.js compatible prefix ($2a$)
    // This is needed because passwords were migrated from a PHP/LAMP stack
    let storedHash = this.password;
    if (storedHash && storedHash.startsWith('$2y$')) {
        storedHash = '$2a$' + storedHash.slice(4);
    }
    return bcrypt.compare(candidatePassword, storedHash);
};

/**
 * Generate JWT token
 */
userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        {
            id: this.user_id,
            role: this.role_id,
            email: this.user_email,
        },
        securityConfig.jwt.secret,
        { expiresIn: securityConfig.jwt.expire }
    );
};

/**
 * Increment login attempts and lock account after max attempts
 * Security: OWASP A07 – Account lockout mechanism
 */
userSchema.methods.incrementLoginAttempts = async function () {
    // If a previous lock has expired, reset attempts
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 },
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    // Lock account after max attempts
    if (this.loginAttempts + 1 >= securityConfig.lockout.maxAttempts) {
        updates.$set = {
            lockUntil: new Date(Date.now() + securityConfig.lockout.lockDurationMs),
        };
    }

    return this.updateOne(updates);
};

/**
 * Reset login attempts on successful login
 */
userSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 },
    });
};

/**
 * JSON transform: exclude password and internal fields
 */
userSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
    },
});

module.exports = mongoose.model('User', userSchema, 'Users');
