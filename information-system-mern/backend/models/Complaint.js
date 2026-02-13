/**
 * Complaint Model — Mongoose Schema
 * Matches existing MongoDB Complaints collection structure
 */
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
    {
        complaint_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
            match: [/^MWC-\d{4}-\d{2}-\d{5}$/, 'Invalid complaint ID format'],
        },
        complaint_description: {
            type: String,
            default: '',
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        complaint_type: {
            type: Number,
            required: [true, 'Complaint type is required'],
        },
        complaint_duration: {
            type: Number,
            required: [true, 'Complaint duration is required'],
        },
        status: {
            type: String,
            required: true,
            enum: ['Pending', 'Verified', 'Resolved', 'Rejected', 'pending', 'verified', 'resolved', 'rejected'],
            default: 'Pending',
        },
        complaint_date: {
            type: Date,
            default: Date.now,
        },
        contact_no: {
            type: Number,
            required: [true, 'Contact number is required'],
        },
        address_detail: {
            type: String,
            required: [true, 'Address detail is required'],
            trim: true,
        },
        street_id: {
            type: Number,
            required: true,
        },
        barangay_id: {
            type: Number,
            required: true,
        },
        submitted_by: {
            type: Number,
            required: true,
        },
        supporting_img: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: false,
        collection: 'Complaints',
    }
);

// Indexes for common queries
complaintSchema.index({ barangay_id: 1, status: 1 });
complaintSchema.index({ submitted_by: 1 });
complaintSchema.index({ complaint_date: -1 });

module.exports = mongoose.model('Complaint', complaintSchema, 'Complaints');
