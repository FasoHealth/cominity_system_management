/**
 * routes/incident.routes.js — Routes pour la gestion des incidents
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Incident = require('../models/Incident');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const { broadcastToAdmins } = require('../utils/notificationManager');
const { storage } = require('../config/cloudinary');

const upload = multer({ storage });

const handleValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Données invalides.',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    return null;
};

/**
 * @swagger
 * tags:
 *   name: Incidents
 *   description: Signalement et gestion des incidents sécuritaires
 */

/**
 * @swagger
 * /incidents:
 *   get:
 *     summary: Récupérer le fil d'actualité des incidents
 *     tags: [Incidents]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: severity
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des incidents
 */
router.get('/', async (req, res) => {
    try {
        const { category, severity, status, search, page = 1, limit = 12 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        else filter.status = 'approved';

        if (category) filter.category = category;
        if (severity) filter.severity = severity;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        const total = await Incident.countDocuments(filter);
        const incidents = await Incident.find(filter)
            .populate('reportedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        res.json({ success: true, total, incidents });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/**
 * @swagger
 * /incidents/mes-signalements:
 *   get:
 *     summary: Récupérer mes propres signalements
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de mes signalements
 */
router.get('/mes-signalements', protect, async (req, res) => {
    try {
        const incidents = await Incident.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, incidents });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/**
 * @swagger
 * /incidents:
 *   post:
 *     summary: Créer un nouveau signalement d'incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, category, severity, address]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               severity: { type: string }
 *               address: { type: string }
 *               lat: { type: number }
 *               lng: { type: number }
 *     responses:
 *       21:
 *         description: Signalement créé
 */
router.post('/', protect, upload.array('images', 4), [
    body('title').trim().notEmpty(),
    body('description').trim().isLength({ min: 20 }),
    body('category').notEmpty(),
    body('severity').notEmpty(),
    body('address').notEmpty()
], async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;
    try {
        const { title, description, category, severity, address, city, lat, lng, isAnonymous } = req.body;
        const incident = await Incident.create({
            title, description, category, severity,
            location: { address, city, coordinates: { type: 'Point', coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0] } },
            reportedBy: req.user._id,
            isAnonymous: isAnonymous === 'true' || isAnonymous === true
        });
        await User.findByIdAndUpdate(req.user._id, { $inc: { incidentsReported: 1 } });

        // --- NOTIFIER LES ADMINS ---
        try {
            const adminUsers = await User.find({ role: 'admin', isActive: true });
            const adminIds = adminUsers.map(admin => admin._id);

            const notifData = {
                type: 'new_incident',
                title: 'Nouveau signalement ⚠️',
                message: `${req.user.name} vient de signaler un incident : "${title}"`,
                incident: incident._id
            };

            // Sauvegarder en DB pour chaque admin
            const notifPromises = adminUsers.map(admin =>
                Notification.create({
                    recipient: admin._id,
                    ...notifData
                })
            );
            await Promise.all(notifPromises);

            // Diffusion temps réel SSE
            broadcastToAdmins(notifData, adminIds);
        } catch (notifErr) {
            console.error('Erreur notification admin :', notifErr);
        }

        res.status(201).json({ success: true, message: 'Signalement réussi.', incident });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/**
 * @swagger
 * /incidents/{id}:
 *   get:
 *     summary: Récupérer les détails d'un incident
 *     tags: [Incidents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Détails de l'incident
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id).populate('reportedBy', 'name');
        if (!incident) return res.status(404).json({ success: false, message: 'Introuvable.' });
        res.json({ success: true, incident });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/**
 * @swagger
 * /incidents/{id}:
 *   delete:
 *     summary: Supprimer son propre signalement
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Supprimé
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) return res.status(404).json({ success: false, message: 'Introuvable.' });
        if (incident.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Action interdite.' });
        }
        await Incident.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Supprimé.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/**
 * @swagger
 * /incidents/{id}/statut:
 *   patch:
 *     summary: Changer statut (Admin)
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: { status: { type: string } }
 *     responses:
 *       200:
 *         description: Statut mis à jour
 */
router.patch('/:id/statut', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Incident.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json({ success: true, incident: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
