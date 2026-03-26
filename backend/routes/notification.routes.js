/**
 * backend/routes/notification.routes.js
 * Routes pour les notifications utilisateur
 */

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications utilisateur
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Récupérer mes notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 notifications:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Notification' }
 *                 unreadCount: { type: integer }
 */
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
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Marquer toutes les notifications comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications mises à jour
 */
router.patch('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});


/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification mise à jour
 *       404:
 *         description: Notification introuvable
 */
router.patch('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification introuvable.' });
        }

        res.json({ success: true, message: 'Notification marquée comme lue.', notification });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Notification introuvable.' });
        res.json({ success: true, message: 'Notification marquée comme lue.', notification });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});


const { registerClient } = require('../utils/notificationManager');

/**
 * @swagger
 * /notifications/stream:
 *   get:
 *     summary: Se connecter au flux de notifications temps réel (SSE)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Flux SSE ouvert
 */
router.get('/stream', protect, (req, res) => {
    registerClient(req, res, req.user._id);
});

module.exports = router;
