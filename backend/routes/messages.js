/**
 * routes/messages.js — Routes pour la messagerie d'incident
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Incident = require('../models/Incident');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// ── GET /api/messages/:incidentId — Récupérer les messages d'un incident ──────
router.get('/:incidentId', protect, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.incidentId);

        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident introuvable.' });
        }

        // Vérifier les permissions : admin ou auteur de l'incident
        if (req.user.role !== 'admin' && incident.reportedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Accès refusé à cette conversation.' });
        }

        const messages = await Message.find({ incident: incident._id })
            .populate('sender', 'name role')
            .sort({ createdAt: 1 });

        // Marquer les messages comme lus par l'utilisateur actuel
        const unreadMessages = messages.filter(
            (msg) => msg.sender && msg.sender._id.toString() !== req.user._id.toString() && !msg.readBy.includes(req.user._id)
        );

        if (unreadMessages.length > 0) {
            await Message.updateMany(
                { _id: { $in: unreadMessages.map(m => m._id) } },
                { $addToSet: { readBy: req.user._id } }
            );
        }

        res.json({ success: true, messages });
    } catch (err) {
        console.error('Erreur GET /messages :', err);
        res.status(500).json({ success: false, message: 'Erreur lors du chargement des messages.' });
    }
});

// ── POST /api/messages/:incidentId — Envoyer un message ──────────────────────
router.post('/:incidentId', protect, async (req, res) => {
    try {
        const { content } = req.body;
        const incident = await Incident.findById(req.params.incidentId);

        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident introuvable.' });
        }

        // Vérifier les permissions
        if (req.user.role !== 'admin' && incident.reportedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Accès refusé.' });
        }

        const message = await Message.create({
            incident: incident._id,
            sender: req.user._id,
            content,
            readBy: [req.user._id]
        });

        // notification pour l'autre partie
        const recipientId = req.user.role === 'admin' ? incident.reportedBy : null;
        // Si c'est l'utilisateur qui envoie, on pourrait notifier "les admins" ou un admin spécifique s'il y a un suivi
        // Pour simplifier, on notifie l'utilisateur si l'admin répond.

        if (req.user.role === 'admin') {
            await Notification.create({
                recipient: incident.reportedBy,
                type: 'new_message',
                title: 'Nouveau message de l\'admin 💬',
                message: `L'administration a envoyé un message concernant votre signalement : "${incident.title}"`,
                incident: incident._id,
            });
        } else {
            // Notifier l'admin qui a modéré le dossier, ou tous les admins
            // Pour simplifier, on cherche un admin actif ou on envoie à tous les admins
            const adminUsers = await User.find({ role: 'admin', isActive: true });
            const adminPromises = adminUsers.map(admin =>
                Notification.create({
                    recipient: admin._id,
                    type: 'new_message',
                    title: 'Nouveau message citoyen 💬',
                    message: `${req.user.name} a envoyé un message sur le signalement "${incident.title}"`,
                    incident: incident._id,
                })
            );
            await Promise.all(adminPromises);
        }

        const populatedMessage = await message.populate('sender', 'name role');

        res.status(201).json({ success: true, message: populatedMessage });
    } catch (err) {
        console.error('Erreur POST /messages :', err);
        // On renvoie une erreur plus explicite si c'est une erreur de validation
        if (err.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Données de message invalides.', errors: err.errors });
        }
        res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du message.' });
    }
});

module.exports = router;
