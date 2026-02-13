/**
 * AdvisoryType Model — Read-only reference collection
 */
const mongoose = require('mongoose');

const advisoryTypeSchema = new mongoose.Schema(
    {
        advisory_type_id: { type: Number, required: true, unique: true },
        advisory_type: { type: String, required: true },
    },
    { timestamps: false, collection: 'Advisory_types' }
);

module.exports = mongoose.model('AdvisoryType', advisoryTypeSchema, 'Advisory_types');
