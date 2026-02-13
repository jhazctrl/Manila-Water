/**
 * Street Model — Read-only reference collection
 */
const mongoose = require('mongoose');

const streetSchema = new mongoose.Schema(
    {
        street_id: { type: Number, required: true, unique: true, index: true },
        street_name: { type: String, required: true },
        brgy_id: { type: Number, required: true, index: true },
    },
    { timestamps: false, collection: 'Streets' }
);

module.exports = mongoose.model('Street', streetSchema, 'Streets');
