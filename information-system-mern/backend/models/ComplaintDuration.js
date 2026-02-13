/**
 * ComplaintDuration Model — Read-only reference collection
 */
const mongoose = require('mongoose');

const complaintDurationSchema = new mongoose.Schema(
    {
        complaint_duration_id: { type: Number, required: true, unique: true },
        complaint_duration: { type: String, required: true },
    },
    { timestamps: false, collection: 'Complaint_duration' }
);

module.exports = mongoose.model('ComplaintDuration', complaintDurationSchema, 'Complaint_duration');
