/**
 * Advisory Model — Mongoose Schema
 * Matches existing MongoDB Advisories collection structure
 */
const mongoose = require('mongoose');

const advisorySchema = new mongoose.Schema(
    {
        advisory_id: {
            type: Number,
            required: true,
            unique: true,
            index: true,
        },
        advisory_type_id: {
            type: Number,
            required: [true, 'Advisory type is required'],
        },
        advisory_description: {
            type: String,
            required: [true, 'Advisory description is required'],
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        start_date: {
            type: String,
            required: [true, 'Start date is required'],
        },
        start_time: {
            type: String,
            required: [true, 'Start time is required'],
        },
        end_date: {
            type: String,
            required: [true, 'End date is required'],
        },
        end_time: {
            type: String,
            required: [true, 'End time is required'],
        },
        status: {
            type: String,
            required: true,
            enum: ['upcoming', 'ongoing', 'Resolved', 'Upcoming', 'Ongoing', 'resolved'],
            default: 'upcoming',
        },
        street_id: {
            type: Number,
            required: true,
        },
        brgy_id: {
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
        collection: 'Advisories',
    }
);

advisorySchema.index({ status: 1, brgy_id: 1 });

module.exports = mongoose.model('Advisory', advisorySchema, 'Advisories');
