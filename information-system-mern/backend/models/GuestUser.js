/**
 * GuestUser Model — Email subscription users
 * Maps to existing Guest_users collection
 */
const mongoose = require('mongoose');

const guestUserSchema = new mongoose.Schema(
    {
        guest_user_id: {
            type: Number,
            required: true,
            unique: true,
            index: true,
        },
        guest_email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        brgy_id: {
            type: Number,
            required: true,
        },
        street_id: {
            type: Number,
            required: true,
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
        collection: 'Guest_users',
    }
);

module.exports = mongoose.model('GuestUser', guestUserSchema, 'Guest_users');
