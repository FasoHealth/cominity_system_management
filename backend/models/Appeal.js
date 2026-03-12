/**
 * models/Appeal.js — Modèle Mongoose pour les demandes de réactivation de compte
 * Community Security Alert | CS27 - Groupe 16
 */

const mongoose = require('mongoose');

const AppealSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        message: {
            type: String,
            required: [true, 'Le message est obligatoire'],
            trim: true,
            maxlength: [2000, 'Le message ne peut pas dépasser 2000 caractères'],
        },
        adminReply: {
            type: String,
            trim: true,
            maxlength: [2000, 'La réponse ne peut pas dépasser 2000 caractères'],
        },
        repliedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        status: {
            type: String,
            enum: ['pending', 'replied', 'resolved'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Appeal', AppealSchema);
