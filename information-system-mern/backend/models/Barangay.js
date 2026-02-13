/**
 * Barangay Model — Read-only reference collection
 */
const mongoose = require('mongoose');

const barangaySchema = new mongoose.Schema(
    {
        brgy_id: { type: Number, required: true, unique: true, index: true },
        brgy_number: { type: String, required: true },
    },
    { timestamps: false, collection: 'Barangays' }
);

module.exports = mongoose.model('Barangay', barangaySchema, 'Barangays');
