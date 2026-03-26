/**
 * backend/routes/admin.routes.js
 * Routes administratives pour le dashboard et la modération
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Incident = require('../models/Incident');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Gestion administrative et statistiques
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Récupérer les statistiques du dashboard admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 */
router.get('/stats', protect, adminOnly, async (req, res) => {
    try {
        const totalIncidents = await Incident.countDocuments();
        const aModerer = await Incident.countDocuments({ status: 'pending' });
        const approuves = await Incident.countDocuments({ status: 'approved' });
        const resolus = await Incident.countDocuments({ status: 'resolved' });

        // Incidents par jour (7 derniers jours)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const incidentsParJour = await Incident.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Répartition par catégories
        const repartitionCategories = await Incident.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            totalIncidents,
            aModerer,
            approuves,
            resolus,
            incidentsParJour,
            repartitionCategories
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/**
 * @swagger
 * /admin/incidents:
 *   get:
 *     summary: Tous les incidents par statut
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Liste des incidents
 */
router.get('/incidents', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const incidents = await Incident.find(filter).populate('reportedBy', 'name email');
        res.json({ success: true, incidents });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/**
 * @swagger
 * /admin/incidents/{id}/moderer:
 *   patch:
 *     summary: Approuver ou rejeter un incident
 *     tags: [Admin]
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
 *               status: { type: string, enum: [approved, rejected] }
 *               noteModeration: { type: string }
 *     responses:
 *       200:
 *         description: Modération effectuée
 */
router.patch('/incidents/:id/moderer', protect, adminOnly, async (req, res) => {
    try {
        const { status, noteModeration } = req.body;
        const incident = await Incident.findByIdAndUpdate(
            req.params.id,
            { status, moderationNote: noteModeration, moderatedBy: req.user._id, moderatedAt: new Date() },
            { new: true }
        );
        res.json({ success: true, message: 'Modération enregistrée.', incident });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/**
 * @swagger
 * /admin/utilisateurs:
 *   get:
 *     summary: Liste des utilisateurs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 */
router.get('/utilisateurs', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/**
 * @swagger
 * /admin/utilisateurs/{id}:
 *   delete:
 *     summary: Supprimer un compte utilisateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 */
router.delete('/utilisateurs/:id', protect, adminOnly, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Utilisateur supprimé.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
