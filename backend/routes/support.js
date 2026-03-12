const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const Appeal = require('../models/Appeal');
const { protect, adminOnly } = require('../middleware/auth');

// ── POST /api/support/appeal — Envoyer une demande de support pour compte bloqué ──────
router.post('/appeal', async (req, res) => {
    try {
        const { email, message } = req.body;

        if (!email || !message) {
            return res.status(400).json({ success: false, message: 'Email et message obligatoires.' });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Aucun compte lié à cet email.' });
        }

        if (user.isActive) {
            return res.status(400).json({ success: false, message: 'Votre compte est déjà actif.' });
        }

        // Créer l'appel dans la DB
        await Appeal.create({
            user: user._id,
            email: user.email,
            message
        });

        // Notifier les admins
        const adminUsers = await User.find({ role: 'admin', isActive: true });
        
        const notifPromises = adminUsers.map(admin => Notification.create({
            recipient: admin._id,
            type: 'system',
            title: 'Demande de réactivation 👤',
            message: `L'utilisateur ${user.name} (${email}) demande la réactivation de son compte.`,
        }));

        await Promise.all(notifPromises);

        res.json({ 
            success: true, 
            message: 'Votre message a été envoyé aux administrateurs. Vous pouvez consulter l\'état ici avec votre email.' 
        });
    } catch (err) {
        console.error('Erreur POST /support/appeal :', err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── GET /api/support/appeals — Liste des appels (Admin) ───────────────────────
router.get('/appeals', protect, adminOnly, async (req, res) => {
    try {
        const appeals = await Appeal.find()
            .populate('user', 'name email avatar')
            .sort({ createdAt: -1 });
        res.json({ success: true, appeals });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── PUT /api/support/appeals/:id/reply — Répondre à un appel (Admin) ─────────
router.put('/appeals/:id/reply', protect, adminOnly, async (req, res) => {
    try {
        const { adminReply, status } = req.body;
        const appeal = await Appeal.findById(req.params.id);

        if (!appeal) {
            return res.status(404).json({ success: false, message: 'Appel introuvable.' });
        }

        appeal.adminReply = adminReply;
        appeal.status = status || 'replied';
        appeal.repliedBy = req.user._id;

        await appeal.save();

        res.json({ success: true, message: 'Réponse enregistrée.', appeal });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── GET /api/support/appeal-status/:email — Consulter l'état (Public) ──────────
router.get('/appeal-status/:email', async (req, res) => {
    try {
        const appeals = await Appeal.find({ email: req.params.email.toLowerCase() })
            .sort({ createdAt: -1 });
        
        res.json({ success: true, appeals });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
