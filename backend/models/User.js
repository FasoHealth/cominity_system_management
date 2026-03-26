/**
 * models/User.js — Modèle Mongoose pour les utilisateurs
 * Community Security Alert | CS27 - Groupe 16
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
    {
        // ── Informations personnelles ─────────────────────────────────────────────
        name: {
            type: String,
            required: [true, 'Le nom est obligatoire'],
            trim: true,
            minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
            maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
        },
        email: {
            type: String,
            required: [true, "L'adresse e-mail est obligatoire"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Adresse e-mail invalide'],
        },
        password: {
            type: String,
            required: [true, 'Le mot de passe est obligatoire'],
            minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
            select: false, // Ne pas inclure dans les requêtes par défaut
        },
        phone: {
            type: String,
            trim: true,
            default: null,
        },
        avatar: {
            type: String,
            default: null,
        },

        // ── Rôle et statut ───────────────────────────────────────────────────────
        role: {
            type: String,
            enum: ['citizen', 'admin'],
            default: 'citizen',
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        // ── Localisation de l'utilisateur (optionnelle) ──────────────────────────
        location: {
            address: { type: String, default: null },
            city: { type: String, default: null },
            country: { type: String, default: 'Burkina Faso' },
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] },
        },

        // ── Statistiques ─────────────────────────────────────────────────────────
        incidentsReported: {
            type: Number,
            default: 0,
        },

        // ── Métadonnées ───────────────────────────────────────────────────────────
        lastLogin: {
            type: Date,
            default: null,
        },

        // ── Réinitialisation du mot de passe ──────────────────────────────────────
        resetPasswordToken: String,
        resetPasswordExpire: Date,

        // ── Vérification Email ────────────────────────────────────────────────────
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: {
            type: String,
            index: true
        },
        emailVerificationExpire: Date,
        emailVerificationCode: String,
        emailVerificationCodeExpire: Date,
        // ── Push Notifications ────────────────────────────────────────────────────
        fcmToken: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true, // Ajoute createdAt et updatedAt automatiquement
    }
);

// ── Hook pre-save : hachage du mot de passe avant enregistrement ──────────────
UserSchema.pre('save', async function (next) {
    // Ne hacher que si le mot de passe a été modifié
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// ── Méthode : comparer le mot de passe fourni avec le hash stocké ─────────────
UserSchema.methods.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

// ── Méthode : retourner l'utilisateur sans le mot de passe ───────────────────
UserSchema.methods.toSafeObject = function () {
    const { password, ...safeUser } = this.toObject();
    return safeUser;
};

// ── Index géospatial ────────────────────────────────────────────────────────
UserSchema.index({ 'location.coordinates': '2dsphere' });
// APRÈS
UserSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('User', UserSchema);
