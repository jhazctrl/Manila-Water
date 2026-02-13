/**
 * Role Model — Read-only reference collection
 */
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
    {
        role_id: { type: Number, required: true, unique: true },
        role_name: { type: String, required: true },
    },
    { timestamps: false, collection: 'Roles' }
);

module.exports = mongoose.model('Role', roleSchema, 'Roles');
