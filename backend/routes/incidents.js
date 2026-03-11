/**
 * routes/incidents.js — Routes pour la gestion des incidents
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const Incident = require('../models/Incident');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// ── Configuration Multer ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/incidents/'),
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format non autorisé. Utilisez jpg, png ou webp.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 4 },
});

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
router.get('/', async (req, res) => {
    try {
        const { category, severity, search, page = 1, limit = 12 } = req.query;

        const filter = { status: 'approved' };
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
// GET /api/incidents/my — Mes propres signalements
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
    try {
        const incidents = await Incident.find({ reportedBy: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ success: true, incidents });
    } catch (err) {
        console.error('Erreur GET /incidents/my :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/incidents — Créer un nouvel incident
// ─────────────────────────────────────────────────────────────────────────────
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
            .isIn(['theft', 'assault', 'vandalism', 'suspicious_activity', 'fire', 'accident', 'other'])
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

            // Construire la liste des images uploadées
            const images = req.files
                ? req.files.map((f) => ({
                    filename: f.filename,
                    originalName: f.originalname,
                    path: f.path.replace(/\\/g, '/'),
                    size: f.size,
                    mimetype: f.mimetype,
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
                        lat: lat ? parseFloat(lat) : null,
                        lng: lng ? parseFloat(lng) : null,
                    }
                },
                images,
                reportedBy: req.user._id,
                isAnonymous: isAnonymous === 'true' || isAnonymous === true,
                status: 'pending',
            });

            // Incrémenter le compteur de signalements de l'utilisateur
            await User.findByIdAndUpdate(req.user._id, { $inc: { incidentsReported: 1 } });

            res.status(201).json({
                success: true,
                message: 'Incident signalé avec succès. Il sera examiné par nos modérateurs.',
                incident,
            });
        } catch (err) {
            console.error('Erreur POST /incidents :', err.message);
            res.status(500).json({ success: false, message: 'Erreur serveur lors du signalement.' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/incidents/:id — Détail d'un incident
// ─────────────────────────────────────────────────────────────────────────────
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
// PUT /api/incidents/:id/moderate — Modérer un incident (admin)
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

            await Notification.create({
                recipient: incident.reportedBy,
                type: notifMessages[newStatus].type,
                title: notifMessages[newStatus].title,
                message: notifMessages[newStatus].message,
                incident: incident._id,
            });

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
        if (incident.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Vous ne pouvez voter que sur un incident approuvé.' });
        }

        const userId = req.user._id.toString();
        const hasVoted = incident.upvotes.some((id) => id.toString() === userId);

        if (hasVoted) {
            // Retirer le vote
            incident.upvotes = incident.upvotes.filter((id) => id.toString() !== userId);
        } else {
            incident.upvotes.push(req.user._id);
        }

        await incident.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: hasVoted ? 'Vote retiré.' : 'Vote enregistré.',
            upvoteCount: incident.upvotes.length,
            hasVoted: !hasVoted,
        });
    } catch (err) {
        console.error('Erreur PUT /incidents/:id/upvote :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
