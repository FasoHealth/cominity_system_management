/**
 * routes/auth.routes.js — Routes d'authentification
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

// ── Helper : formatter les erreurs de validation ──────────────────────────────
const handleValidationErrors = (req, res) => {
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
// POST /api/auth/register — Inscription d'un nouvel utilisateur
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juda Ouattara
 *               email:
 *                 type: string
 *                 example: juda@example.com
 *               password:
 *                 type: string
 *                 example: motdepasse123
 *               phone:
 *                 type: string
 *                 example: "+22601020304"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Le nom est obligatoire.')
            .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères.'),
        body('email').isEmail().withMessage('Adresse e-mail invalide.').normalizeEmail(),
        body('password')
            .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.')
            .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),
        body('phone').optional().trim(),
    ],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const { name, email, password, phone } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Cette adresse e-mail est déjà utilisée.',
                });
            }

            const user = await User.create({ name, email, password, phone });

            const token = generateToken(user._id);

            res.status(201).json({
                success: true,
                message: 'Inscription réussie. Bienvenue !',
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    isActive: user.isActive,
                    incidentsReported: user.incidentsReported,
                    createdAt: user.createdAt,
                },
            });
        } catch (err) {
            console.error('Erreur register DETAIL :', err);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de l\'inscription.',
            });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login — Connexion
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion de l'utilisateur
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: juda@example.com
 *               password:
 *                 type: string
 *                 example: motdepasse123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Identifiants incorrects
 *       500:
 *         description: Erreur serveur
 */
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Adresse e-mail invalide.').normalizeEmail(),
        body('password').notEmpty().withMessage('Le mot de passe est obligatoire.'),
    ],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'E-mail ou mot de passe incorrect.',
                });
            }

            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Votre compte a été désactivé. Contactez un administrateur.',
                });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'E-mail ou mot de passe incorrect.',
                });
            }

            user.lastLogin = new Date();
            await user.save({ validateBeforeSave: false });

            const token = generateToken(user._id);

            res.json({
                success: true,
                message: 'Connexion réussie.',
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    isActive: user.isActive,
                    incidentsReported: user.incidentsReported,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt,
                },
            });
        } catch (err) {
            console.error('Erreur login DETAIL :', err);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la connexion.',
            });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me — Récupérer le profil de l'utilisateur connecté
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Utilisateur non trouvé.' });
        }
        res.json({
            success: true,
            user,
        });
    } catch (err) {
        console.error('Erreur /me :', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
