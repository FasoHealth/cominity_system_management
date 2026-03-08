/**
 * routes/users.js — Routes de gestion des utilisateurs (admin)
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Incident = require('../models/Incident');
const { protect, adminOnly } = require('../middleware/auth');

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

        // Empêcher la désactivation d'un autre admin
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Impossible de modifier le statut d\'un administrateur.',
            });
        }

        user.isActive = !user.isActive;
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: `Compte ${user.isActive ? 'activé' : 'désactivé'} avec succès.`,
            user: { _id: user._id, name: user.name, email: user.email, isActive: user.isActive },
        });
    } catch (err) {
        console.error('Erreur PUT /users/:id/toggle :', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        }
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
