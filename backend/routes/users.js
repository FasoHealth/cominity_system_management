/**
 * routes/users.js — Routes de gestion des utilisateurs (admin)
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Incident = require('../models/Incident');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ── Configuration Multer pour les avatars ─────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
    filename: (req, file, cb) => {
        const uniqueName = `avatar-${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo max pour un avatar
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Format non autorisé. Utilisez jpg, png ou webp.'));
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users — Liste tous les utilisateurs (admin uniquement)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const { search, role, isActive, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await User.countDocuments(filter);

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            users,
        });
    } catch (err) {
        console.error('Erreur GET /users :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/stats — Statistiques pour le dashboard admin
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', protect, adminOnly, async (req, res) => {
    try {
        // Statistiques utilisateurs
        const totalUsers = await User.countDocuments({ role: 'citizen' });
        const activeUsers = await User.countDocuments({ role: 'citizen', isActive: true });

        // Statistiques incidents
        const totalIncidents = await Incident.countDocuments();
        const pendingIncidents = await Incident.countDocuments({ status: 'pending' });
        const approvedIncidents = await Incident.countDocuments({ status: 'approved' });
        const rejectedIncidents = await Incident.countDocuments({ status: 'rejected' });
        const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });

        // Incidents par catégorie
        const byCategory = await Incident.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Incidents par gravité
        const bySeverity = await Incident.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } },
        ]);

        // Incidents des 7 derniers jours (pour graphique)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const last7Days = await Incident.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({
            success: true,
            stats: {
                users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
                incidents: {
                    total: totalIncidents,
                    pending: pendingIncidents,
                    approved: approvedIncidents,
                    rejected: rejectedIncidents,
                    resolved: resolvedIncidents,
                },
                byCategory,
                bySeverity,
                last7Days,
            },
        });
    } catch (err) {
        console.error('Erreur GET /users/stats :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/:id/toggle — Activer / Désactiver un compte utilisateur
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/toggle', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        }

        // Empêcher de se désactiver soi-même
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Vous ne pouvez pas désactiver votre propre compte.' });
        }

        user.isActive = !user.isActive;
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: `Compte ${user.isActive ? 'réactivé' : 'désactivé'} avec succès.`,
            user: { _id: user._id, isActive: user.isActive }
        });
    } catch (err) {
        console.error('Erreur toggle user :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/profile — Mettre à jour son propre profil
// ─────────────────────────────────────────────────────────────────────────────
router.put('/profile', protect, upload.single('avatar'), async (req, res) => {
    try {
        const { name, phone, city } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        }

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (city !== undefined) {
            if (!user.location) user.location = {};
            user.location.city = city;
        }

        const { lat, lng } = req.body;
        if (lat && lng) {
            user.location.coordinates = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            };
        }

        if (req.file) {
            user.avatar = `/uploads/avatars/${req.file.filename}`;
        }

        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                location: user.location,
                avatar: user.avatar,
                role: user.role
            },
        });
    } catch (err) {
        console.error('Erreur PUT /api/users/profile :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour.' });
    }
});

module.exports = router;
