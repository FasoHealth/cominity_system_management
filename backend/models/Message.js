/**
 * models/Message.js — Modèle Mongoose pour la messagerie entre admin et citoyens
 * Community Security Alert | CS27 - Groupe 16
 */

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
    {
        incident: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Incident',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['text', 'audio', 'image', 'video', 'file'],
            default: 'text'
        },
        content: {
            type: String,
            trim: true,
            maxlength: [1000, 'Le message ne peut pas dépasser 1000 caractères'],
        },
        attachments: [
            {
                filename: String,
                path: String,
                mimetype: String,
            }
        ],
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
    },
    {
        timestamps: true,
    }
);

// Index pour optimiser la récupération des messages par incident
MessageSchema.index({ incident: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
