/**
 * models/Notification.js — Modèle Mongoose pour les notifications
 * Community Security Alert | CS27 - Groupe 16
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
    {
        // ── Destinataire ─────────────────────────────────────────────────────────
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // ── Type de notification ─────────────────────────────────────────────────
        type: {
            type: String,
            enum: ['incident_approved', 'incident_rejected', 'incident_resolved', 'incident_upvoted', 'new_message', 'message', 'system'],
            required: true,
        },

        // ── Contenu ───────────────────────────────────────────────────────────────
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },

        // ── Référence à l'incident concerné (optionnelle) ─────────────────────────
        incident: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Incident',
            default: null,
        },

        // ── État ──────────────────────────────────────────────────────────────────
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// ── Index pour récupérer les notifications d'un utilisateur efficacement ──────
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
