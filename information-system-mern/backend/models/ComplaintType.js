/**
 * ComplaintType Model — Read-only reference collection
 */
const mongoose = require('mongoose');

const complaintTypeSchema = new mongoose.Schema(
    {
        complaint_type_id: { type: Number, required: true, unique: true },
        complaint_type: { type: String, required: true },
    },
    { timestamps: false, collection: 'Complaint_types' }
);

module.exports = mongoose.model('ComplaintType', complaintTypeSchema, 'Complaint_types');
