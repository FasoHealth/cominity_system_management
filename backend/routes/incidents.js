/**
 * routes/incidents.js — Routes pour la gestion des incidents
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const Incident = require('../models/Incident');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const { sendNotification, broadcastToAdmins } = require('../utils/notificationManager');

// ── Configuration Cloudinary ───────────────────────────────────────────────────
const { cloudinary, storage } = require('../config/cloudinary');

// ── Configuration Multer avec Cloudinary ───────────────────────────────────────
const upload = multer({ storage });

// ── Helper validation ─────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/incidents — Fil public des incidents approuvés
// ─────────────────────────────────────────────────────────────────────────────
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
 *         description: Filtrer par catégorie (vol, agression, etc.)
 *       - in: query
 *         name: severity
 *         schema: { type: string }
 *         description: Filtrer par gravité (faible, medium, eleve)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche textuelle (titre, description, adresse)
 *     responses:
 *       200:
 *         description: Liste des incidents récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 total: { type: integer }
 *                 incidents:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Incident' }
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
    try {
        const { category, severity, status, search, page = 1, limit = 12 } = req.query;

        const filter = {};
        if (status) {
            filter.status = status;
        } else {
            // Par défaut: uniquement les incidents approuvés par l'administrateur
            filter.status = 'approved';
        }

        if (category) filter.category = category;
        if (severity) filter.severity = severity;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'location.address': { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Incident.countDocuments(filter);

        const incidents = await Incident.find(filter)
            .populate('reportedBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        // Masquer le nom si anonyme
        const safeIncidents = incidents.map((inc) => ({
            ...inc,
            reportedBy: inc.isAnonymous ? null : inc.reportedBy,
        }));

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            incidents: safeIncidents,
        });
    } catch (err) {
        console.error('Erreur GET /incidents :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/incidents/admin — Tous les incidents pour l'admin
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin', protect, adminOnly, async (req, res) => {
    try {
        const { status, category, severity, page = 1, limit = 15 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (severity) filter.severity = severity;

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Incident.countDocuments(filter);

        const incidents = await Incident.find(filter)
            .populate('reportedBy', 'name email')
            .populate('moderatedBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Comptages par statut pour le tableau de bord
        const counts = await Incident.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const statusCounts = counts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {});

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            statusCounts,
            incidents,
        });
    } catch (err) {
        console.error('Erreur GET /incidents/admin :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/incidents/mes-signalements — Mes propres signalements
// ─────────────────────────────────────────────────────────────────────────────
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 incidents:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Incident' }
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get('/mes-signalements', protect, async (req, res) => {
    try {
        const incidents = await Incident.find({ reportedBy: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ success: true, incidents });
    } catch (err) {
        console.error('Erreur GET /incidents/mes-signalements :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// Alias pour la compatibilité avec le frontend
router.get('/my', protect, async (req, res) => {
    try {
        const incidents = await Incident.find({ reportedBy: req.user._id })
            .sort({ createdAt: -1 });
        res.json({ success: true, incidents });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/incidents — Créer un nouvel incident
// ─────────────────────────────────────────────────────────────────────────────
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
 *               title: { type: string, example: "Agression boulevard" }
 *               description: { type: string, minLength: 20 }
 *               category: { type: string, enum: [theft, assault, vandalism, fire, other] }
 *               severity: { type: string, enum: [low, medium, high, critical] }
 *               address: { type: string }
 *               lat: { type: number, example: 12.3647 }
 *               lng: { type: number, example: -1.5332 }
 *               isAnonymous: { type: boolean }
 *     responses:
 *       201:
 *         description: Incident créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.post(
    '/',
    protect,
    upload.array('images', 4),
    [
        body('title').trim().notEmpty().withMessage('Le titre est obligatoire.')
            .isLength({ min: 5, max: 100 }).withMessage('Le titre doit contenir entre 5 et 100 caractères.'),
        body('description').trim().notEmpty().withMessage('La description est obligatoire.')
            .isLength({ min: 20, max: 2000 }).withMessage('La description doit contenir entre 20 et 2000 caractères.'),
        body('category')
            .isIn(['theft', 'assault', 'vandalism', 'suspicious_activity', 'fire', 'kidnapping', 'other'])
            .withMessage('Catégorie invalide.'),
        body('severity')
            .isIn(['low', 'medium', 'high', 'critical'])
            .withMessage('Niveau de gravité invalide.'),
        body('address').trim().notEmpty().withMessage("L'adresse est obligatoire."),
        body('city').optional().trim(),
    ],
    async (req, res) => {
        const validationError = handleValidation(req, res);
        if (validationError) return;

        try {
            const { title, description, category, severity, address, city, lat, lng, isAnonymous } = req.body;

            // Construire la liste des images uploadées vers Cloudinary
            const images = req.files
                ? req.files.map((f) => ({
                    filename: f.filename,
                    originalName: f.originalname,
                    path: f.path, // URL Cloudinary retournée par multer-storage-cloudinary
                    size: f.size,
                    mimetype: f.mimetype,
                    public_id: f.public_id, // ID Cloudinary
                    secure_url: f.secure_url // URL sécurisée Cloudinary
                }))
                : [];

            const incident = await Incident.create({
                title,
                description,
                category,
                severity,
                location: {
                    address,
                    city,
                    coordinates: {
                        type: 'Point',
                        coordinates: [
                            lng ? parseFloat(lng) : 0,
                            lat ? parseFloat(lat) : 0
                        ]
                    }
                },
                images,
                reportedBy: req.user._id,
                isAnonymous: isAnonymous === 'true' || isAnonymous === true,
                status: 'pending',
            });

            // Incrémenter le compteur de signalements de l'utilisateur
            await User.findByIdAndUpdate(req.user._id, { $inc: { incidentsReported: 1 } });

            // Notifier les admins (DB + Temps Réel SSE)
            try {
                const admins = await User.find({ role: 'admin', isActive: true });
                const adminIds = admins.map(a => a._id);

                const notifData = {
                    type: 'new_incident',
                    title: 'Nouveau signalement ⚠️',
                    message: `${req.user.name} vient de signaler un incident : "${title}"`,
                    incident: incident._id
                };

                // Créer en DB pour chaque admin
                const adminNotifPromises = admins.map(admin =>
                    Notification.create({
                        recipient: admin._id,
                        ...notifData
                    })
                );
                await Promise.all(adminNotifPromises);

                // Diffusion SSE
                broadcastToAdmins(notifData, adminIds);
            } catch (notifErr) {
                console.error('Erreur notification admin :', notifErr);
            }

            res.status(201).json({
                success: true,
                message: 'Incident signalé avec succès. Il sera examiné par nos modérateurs.',
                incident,
            });
        } catch (err) {
            console.error('Erreur POST /incidents DETAIL :', err);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors du signalement.',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/incidents/:id — Détail d'un incident
// ─────────────────────────────────────────────────────────────────────────────
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 incident: { $ref: '#/components/schemas/Incident' }
 *       404:
 *         description: Incident introuvable
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate('reportedBy', 'name')
            .populate('moderatedBy', 'name');

        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident introuvable.' });
        }

        // Incrémenter le compteur de vues
        incident.views += 1;
        await incident.save({ validateBeforeSave: false });

        // Masquer l'auteur si anonyme et que l'utilisateur actuel n'est ni l'auteur ni un admin
        const response = incident.toObject();
        if (response.isAnonymous) {
            const isAuthor = req.user && response.reportedBy && req.user._id.toString() === response.reportedBy._id.toString();
            const isAdmin = req.user && req.user.role === 'admin';

            if (!isAuthor && !isAdmin) {
                response.reportedBy = null;
            }
        }

        res.json({ success: true, incident: response });
    } catch (err) {
        console.error('Erreur GET /incidents/:id :', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Incident introuvable.' });
        }
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/incidents/:id — Supprimer son propre incident
// ─────────────────────────────────────────────────────────────────────────────
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
 *         description: Incident supprimé avec succès
 *       403:
 *         description: Action interdite (non auteur)
 *       404:
 *         description: Incident introuvable
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) return res.status(404).json({ success: false, message: 'Incident introuvable.' });

        if (incident.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Non autorisé.' });
        }

        await Incident.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Incident supprimé.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/incidents/:id/statut — Changer statut (admin)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /incidents/{id}/statut:
 *   patch:
 *     summary: Changer le statut d'un incident (Admin)
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
 *             properties:
 *               status: { type: string, enum: [en_attente, approuve, rejete, resolu] }
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *       403:
 *         description: Accès refusé
 */
router.patch(
    '/:id/statut',
    protect,
    adminOnly,
    async (req, res) => {
        try {
            const { status } = req.body;
            // Map French status to DB status if needed, or assume DB uses same or handle accordingly
            // For documentation purpose, we keep it simple.
            const updated = await Incident.findByIdAndUpdate(req.params.id, { status }, { new: true });
            res.json({ success: true, incident: updated });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erreur serveur.' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/incidents/:id/moderate — Modérer un incident (admin - ancienne route)
// ─────────────────────────────────────────────────────────────────────────────
router.put(
    '/:id/moderate',
    protect,
    adminOnly,
    [
        body('status')
            .isIn(['approved', 'rejected', 'resolved'])
            .withMessage('Statut invalide. Valeurs : approved, rejected, resolved.'),
        body('moderationNote').optional().trim()
            .isLength({ max: 500 }).withMessage('La note ne peut pas dépasser 500 caractères.'),
    ],
    async (req, res) => {
        const validationError = handleValidation(req, res);
        if (validationError) return;

        try {
            const { status: newStatus, moderationNote } = req.body;

            const incident = await Incident.findById(req.params.id);
            if (!incident) {
                return res.status(404).json({ success: false, message: 'Incident introuvable.' });
            }

            const currentStatus = incident.status;

            // ── Règles métier de transition STRICTE ──────────────────────
            if (currentStatus === 'rejected' || currentStatus === 'resolved') {
                return res.status(400).json({
                    success: false,
                    message: `Action impossible. Ce dossier est déjà clôturé (statut: ${currentStatus}).`
                });
            }

            if (currentStatus === 'pending') {
                if (!['approved', 'rejected'].includes(newStatus)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Un dossier en attente ne peut être qu’approuvé ou rejeté.'
                    });
                }
            }

            if (currentStatus === 'approved') {
                if (newStatus !== 'resolved') {
                    return res.status(400).json({
                        success: false,
                        message: 'Un dossier approuvé ne peut être que marqué comme résolu.'
                    });
                }
            }

            if (newStatus === currentStatus) {
                return res.status(400).json({ success: false, message: 'L\'incident a déjà ce statut.' });
            }

            incident.status = newStatus;
            incident.moderatedBy = req.user._id;
            incident.moderatedAt = new Date();
            if (moderationNote !== undefined) incident.moderationNote = moderationNote;

            await incident.save();

            // Créer une notification pour l'auteur de l'incident
            const notifMessages = {
                approved: {
                    title: 'Incident approuvé ✅',
                    message: `Votre signalement "${incident.title}" a été approuvé et est maintenant visible par la communauté.`,
                    type: 'incident_approved',
                },
                rejected: {
                    title: 'Incident rejeté ❌',
                    message: `Votre signalement "${incident.title}" a été rejeté.${moderationNote ? ` Raison : ${moderationNote}` : ''}`,
                    type: 'incident_rejected',
                },
                resolved: {
                    title: 'Incident résolu ✅',
                    message: `L'incident "${incident.title}" que vous avez signalé a été marqué comme résolu.`,
                    type: 'incident_resolved',
                },
            };

            const notifData = {
                recipient: incident.reportedBy,
                type: notifMessages[newStatus].type,
                title: notifMessages[newStatus].title,
                message: notifMessages[newStatus].message,
                incident: incident._id,
            };

            await Notification.create(notifData);

            // Notification Temps Réel via SSE
            sendNotification(notifData, incident.reportedBy);

            // Si approuvé, envoyer une notification à l'auteur ET aux personnes à proximité (500m)
            if (newStatus === 'approved') {
                // 1. Notification Author (déjà fait plus haut mais on s'assure de l'exclusion dans la suite)

                // 2. Notification Proximité (500m)
                const nearbyUsers = await User.find({
                    _id: { $ne: incident.reportedBy }, // Exclure l'auteur
                    isActive: true,
                    role: 'citizen',
                    'location.coordinates': {
                        $near: {
                            $geometry: incident.location.coordinates,
                            $maxDistance: 500 // 500 mètres
                        }
                    }
                });

                const proximityNotifs = nearbyUsers.map(u => ({
                    recipient: u._id,
                    type: 'new_incident_nearby',
                    title: '⚠️ Alerte à proximité',
                    message: `Un incident "${incident.title}" a été signalé à moins de 500m de vous (${incident.location.address}).`,
                    incident: incident._id
                }));

                if (proximityNotifs.length > 0) {
                    await Notification.insertMany(proximityNotifs);

                    // Notifier les utilisateurs à proximité en temps réel via SSE
                    proximityNotifs.forEach(notif => {
                        sendNotification(notif, notif.recipient);
                    });
                }
            }

            res.json({
                success: true,
                message: `Incident ${newStatus === 'approved' ? 'approuvé' : newStatus === 'rejected' ? 'rejeté' : 'résolu'} avec succès.`,
                incident,
            });
        } catch (err) {
            console.error('Erreur PUT /incidents/:id/moderate :', err.message);
            res.status(500).json({ success: false, message: 'Erreur serveur lors de la modération.' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/incidents/:id/upvote — Voter pour confirmer un incident
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/upvote', protect, async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident introuvable.' });
        }
        if (incident.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Vous ne pouvez plus voter pour cet incident car il est déjà approuvé ou clôturé.' });
        }

        if (req.user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Les administrateurs ne peuvent pas voter.' });
        }

        const userId = req.user._id.toString();
        const hasVoted = incident.upvotes.some((id) => id.toString() === userId);

        if (hasVoted) {
            incident.upvotes = incident.upvotes.filter((id) => id.toString() !== userId);
        } else {
            incident.upvotes.push(req.user._id);
        }

        // Logic de validation automatique : 5 votes
        let autoApproved = false;
        if (incident.status === 'pending' && incident.upvotes.length >= 5) {
            incident.status = 'approved';
            incident.moderationNote = "Approbation automatique : Seuil de 5 confirmations atteint.";
            incident.moderatedAt = new Date();
            autoApproved = true;
        }

        await incident.save({ validateBeforeSave: false });

        if (autoApproved) {
            // Envoyer une notification à l'auteur
            await Notification.create({
                recipient: incident.reportedBy,
                type: 'incident_approved',
                title: 'Incident approuvé automatiquement ✅',
                message: `Votre signalement "${incident.title}" a été approuvé automatiquement grâce aux confirmations de la communauté.`,
                incident: incident._id,
            });

            // Notification proximité (500m) pour les autres
            const nearbyUsers = await User.find({
                _id: { $ne: incident.reportedBy },
                isActive: true,
                role: 'citizen',
                'location.coordinates': {
                    $near: {
                        $geometry: incident.location.coordinates,
                        $maxDistance: 500
                    }
                }
            });

            const proximityNotifs = nearbyUsers.map(u => ({
                recipient: u._id,
                type: 'new_incident_nearby',
                title: '⚠️ Alerte à proximité (Confirmée)',
                message: `L'incident "${incident.title}" a été confirmé par la communauté à moins de 500m de vous.`,
                incident: incident._id
            }));

            if (proximityNotifs.length > 0) {
                await Notification.insertMany(proximityNotifs);
            }
        }

        res.json({
            success: true,
            message: hasVoted ? 'Vote retiré.' : 'Vote enregistré.',
            incident,
            upvoteCount: incident.upvotes.length,
            hasVoted: !hasVoted,
            status: incident.status,
            autoApproved
        });
    } catch (err) {
        console.error('Erreur PUT /incidents/:id/upvote :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/incidents/:id — Modifier son propre incident (avant approbation)
// ─────────────────────────────────────────────────────────────────────────────
router.put(
    '/:id',
    protect,
    upload.array('images', 4),
    [
        body('title').optional().trim().isLength({ min: 5, max: 100 }),
        body('description').optional().trim().isLength({ min: 20, max: 2000 }),
        body('category').optional().isIn(['theft', 'assault', 'vandalism', 'suspicious_activity', 'fire', 'kidnapping', 'other']),
        body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        try {
            const incident = await Incident.findById(req.params.id);
            if (!incident) return res.status(404).json({ success: false, message: 'Incident introuvable.' });

            // Sécurité : Seul l'auteur peut modifier
            if (incident.reportedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Action interdite.' });
            }

            // Sécurité : On ne peut modifier qu'en attente
            if (incident.status !== 'pending') {
                return res.status(400).json({ success: false, message: 'Vous ne pouvez plus modifier cet incident une fois approuvé.' });
            }

            const { title, description, category, severity, address, city, lat, lng } = req.body;

            if (title) incident.title = title;
            if (description) incident.description = description;
            if (category) incident.category = category;
            if (severity) incident.severity = severity;
            if (address) incident.location.address = address;
            if (city) incident.location.city = city;

            if (lat && lng) {
                incident.location.coordinates = {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                };
            }

            // Gestion des nouvelles images
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map(f => ({
                    filename: f.filename,
                    originalName: f.originalname,
                    path: f.path.replace(/\\/g, '/'),
                    size: f.size,
                    mimetype: f.mimetype,
                }));
                // Dans cet exemple, on ajoute aux images existantes
                incident.images.push(...newImages);
            }

            await incident.save();

            res.json({ success: true, message: 'Incident mis à jour.', incident });
        } catch (err) {
            console.error('Erreur PUT /incidents/:id :', err);
            res.status(500).json({ success: false, message: 'Erreur serveur.' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/incidents/:id/notify-services — Notifier les services compétents (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/notify-services', protect, adminOnly, async (req, res) => {
    try {
        const { service, message } = req.body; // service: 'police' | 'firefighters'
        const incident = await Incident.findById(req.params.id);

        if (!incident) return res.status(404).json({ success: false, message: 'Incident introuvable.' });
        if (incident.status !== 'approved') return res.status(400).json({ success: false, message: 'L\'incident doit être approuvé avant de notifier les services.' });

        // Ici on simulerait l'envoi d'un mail ou d'une notification push aux services
        // Pour l'instant on met à jour une note ou un flag si nécessaire
        console.log(`Notification envoyée au service ${service} pour l'incident ${incident.title}`);

        // On pourrait ajouter une note de modération automatique
        incident.moderationNote = `${incident.moderationNote || ''}\n[Notification Service] ${service.toUpperCase()} contacté le ${new Date().toLocaleString()}.`.trim();
        await incident.save();

        res.json({
            success: true,
            message: `Le service ${service === 'police' ? 'de Police' : 'des Sapeurs-Pompiers'} a été notifié.`
        });
    } catch (err) {
        console.error('Erreur POST /incidents/:id/notify-services :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
