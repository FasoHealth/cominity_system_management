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
                values: ['theft', 'assault', 'vandalism', 'suspicious_activity', 'fire', 'kidnapping', 'other'],
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
        policeNotified: {
            type: Boolean,
            default: false,
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
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point'
                },
                // [longitude, latitude]
                coordinates: {
                    type: [Number],
                    default: [0, 0]
                }
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
    }
);

// ── Champs virtuels ──────────────────────────────────────────────────────────
IncidentSchema.virtual('upvoteCount').get(function () {
    return this.upvotes ? this.upvotes.length : 0;
});

// Virtuals pour compatibilité frontend (lat/lng)
IncidentSchema.virtual('lat').get(function () {
    return this.location.coordinates.coordinates[1];
});
IncidentSchema.virtual('lng').get(function () {
    return this.location.coordinates.coordinates[0];
});

// ── Index pour les recherches fréquentes ─────────────────────────────────────
IncidentSchema.index({ status: 1, createdAt: -1 });
IncidentSchema.index({ category: 1 });
IncidentSchema.index({ severity: 1 });
IncidentSchema.index({ reportedBy: 1 });
IncidentSchema.index({ 'location.coordinates': '2dsphere' });

// Création automatique de l'index géospatial si absent
IncidentSchema.on('index', function(error) {
    if (error) {
        console.error('Erreur lors de la création des index Incident:', error);
    }
});

// ── Validation automatique retirée au profit du seuil de 5 votes ──
IncidentSchema.pre('save', async function (next) {
    next();
});

// ── Fonctionnalité 1 : Notification Police (Post-save hook) ──────────────────
IncidentSchema.post('save', async function (doc, next) {
    try {
        if (doc.status === 'approved' && !doc.policeNotified) {
            const User = mongoose.model('User');
            const poliUsers = await User.find({ role: 'police' }).select('+fcmToken');
            const policeTokens = poliUsers.map(u => u.fcmToken).filter(t => t);

            if (policeTokens.length > 0) {
                const payload = {
                    notification: {
                        title: `🚨 URGENCE : ${doc.title}`,
                        body: `Catégorie: ${doc.category}\nDesc: ${doc.description}\nGPS: ${doc.location.coordinates.lat}, ${doc.location.coordinates.lng}`
                    },
                    tokens: policeTokens,
                    android: { priority: 'high' },
                    apns: { payload: { aps: { 'content-available': 1, priority: 10 } } }
                };

                try {
                    const admin = require('firebase-admin');
                    if (admin.apps.length > 0) {
                        await admin.messaging().sendEachForMulticast(payload);
                    }
                } catch (e) {
                    console.log("Firebase n'est pas configuré; notification ignorée.", e.message);
                }
            }

            await this.constructor.updateOne(
                { _id: doc._id },
                { $set: { policeNotified: true } }
            );
        }
        next();
    } catch (error) {
        console.error('Erreur hook police notification:', error);
        next();
    }
});

module.exports = mongoose.model('Incident', IncidentSchema);
