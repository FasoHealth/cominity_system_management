/**
 * routes/users.js — Routes de gestion des utilisateurs (admin)
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Incident = require('../models/Incident');
const { protect, adminOnly } = require('../middleware/auth');
const { avatarStorage } = require('../config/cloudinary');
const multer = require('multer');

// ── Configuration Multer Cloudinary pour les avatars ───────────────────────────
const upload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
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
/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Récupérer les statistiques globales pour le dashboard admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 stats:
 *                   type: object
 *                   properties:
 *                     users: { type: object }
 *                     incidents: { type: object }
 *                     byCategory: { type: array }
 *                     bySeverity: { type: array }
 *                     last7Days: { type: array }
 *                     monthlyTrend: { type: array }
 *                     resolutionRateByCategory: { type: array }
 *                     topReporters: { type: array }
 */
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

        // Incidents des 6 derniers mois (pour graphique)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Début du mois

        const monthlyTrend = await Incident.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Taux de résolution par catégorie
        const resolutionRateByCategory = await Incident.aggregate([
            {
                $group: {
                    _id: '$category',
                    total: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
                }
            },
            {
                $project: {
                    rate: { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
                    total: 1,
                    resolved: 1
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Top 5 Citoyens (ceux qui signalent le plus)
        const topReporters = await Incident.aggregate([
            { $group: { _id: '$reportedBy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    name: '$userInfo.name',
                    email: '$userInfo.email',
                    count: 1
                }
            }
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
                monthlyTrend,
                resolutionRateByCategory,
                topReporters
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
            if (!user.location) user.location = {};
            user.location.type = 'Point';
            user.location.coordinates = [parseFloat(lng), parseFloat(lat)];
        }

        if (req.file) {
            user.avatar = req.file.path; // URL Cloudinary
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/fcm-token — Enregistrer un token FCM pour les notifications
// ─────────────────────────────────────────────────────────────────────────────
router.post('/fcm-token', protect, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ success: false, message: 'Token manquant.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        }

        user.fcmToken = fcmToken;
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: 'Token FCM mis à jour.',
        });
    } catch (err) {
        console.error('Erreur POST /fcm-token :', err.message);
        res.status(500).json({ success: true, message: 'Erreur serveur.' });
    }
});

module.exports = router;
