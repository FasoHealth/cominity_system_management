/**
 * routes/notifications.js — Routes pour les notifications utilisateur
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications — Récupérer mes notifications
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate('incident', 'title category')
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false,
        });

        res.json({ success: true, notifications, unreadCount });
    } catch (err) {
        console.error('Erreur GET /notifications :', err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', stack: err.stack });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/notifications/read-all — Marquer toutes comme lues
// ─────────────────────────────────────────────────────────────────────────────
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues.' });
    } catch (err) {
        console.error('Erreur PUT /notifications/read-all :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/notifications/:id/read — Marquer une notification comme lue
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user._id, // S'assurer que c'est bien la notification de cet utilisateur
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification introuvable.' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ success: true, message: 'Notification marquée comme lue.', notification });
    } catch (err) {
        console.error('Erreur PUT /notifications/:id/read :', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Notification introuvable.' });
        }
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
