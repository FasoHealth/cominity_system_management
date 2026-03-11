/**
 * models/Incident.js — Modèle Mongoose pour les incidents de sécurité
 * Community Security Alert | CS27 - Groupe 16
 */

const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema(
    {
        // ── Informations principales ──────────────────────────────────────────────
        title: {
            type: String,
            required: [true, 'Le titre est obligatoire'],
            trim: true,
            minlength: [5, 'Le titre doit contenir au moins 5 caractères'],
            maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
        },
        description: {
            type: String,
            required: [true, 'La description est obligatoire'],
            trim: true,
            minlength: [20, 'La description doit contenir au moins 20 caractères'],
            maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
        },
        category: {
            type: String,
            required: [true, 'La catégorie est obligatoire'],
            enum: {
                values: ['theft', 'assault', 'vandalism', 'suspicious_activity', 'fire', 'accident', 'other'],
                message: 'Catégorie invalide',
            },
        },
        severity: {
            type: String,
            required: [true, 'Le niveau de gravité est obligatoire'],
            enum: {
                values: ['low', 'medium', 'high', 'critical'],
                message: 'Niveau de gravité invalide',
            },
        },

        // ── Statut et modération ─────────────────────────────────────────────────
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'resolved'],
            default: 'pending',
        },
        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        moderatedAt: {
            type: Date,
            default: null,
        },
        moderationNote: {
            type: String,
            trim: true,
            maxlength: [500, 'La note de modération ne peut pas dépasser 500 caractères'],
            default: null,
        },

        // ── Localisation ─────────────────────────────────────────────────────────
        location: {
            address: {
                type: String,
                required: [true, "L'adresse est obligatoire"],
                trim: true,
            },
            city: {
                type: String,
                trim: true,
                default: null,
            },
            coordinates: {
                lat: { type: Number, default: null },
                lng: { type: Number, default: null },
            },
        },

        // ── Images jointes ───────────────────────────────────────────────────────
        images: [
            {
                filename: { type: String },
                originalName: { type: String },
                path: { type: String },
                size: { type: Number },
                mimetype: { type: String },
            },
        ],

        // ── Auteur ───────────────────────────────────────────────────────────────
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isAnonymous: {
            type: Boolean,
            default: false,
        },

        // ── Interactions ─────────────────────────────────────────────────────────
        upvotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        views: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ── Champ virtuel : nombre de votes ──────────────────────────────────────────
IncidentSchema.virtual('upvoteCount').get(function () {
    return this.upvotes ? this.upvotes.length : 0;
});

// ── Index pour les recherches fréquentes ─────────────────────────────────────
IncidentSchema.index({ status: 1, createdAt: -1 });
IncidentSchema.index({ category: 1 });
IncidentSchema.index({ severity: 1 });
IncidentSchema.index({ reportedBy: 1 });

module.exports = mongoose.model('Incident', IncidentSchema);
