/**
 * routes/auth.js — Routes d'authentification
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const crypto = require('crypto');

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
            .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
        body('phone').optional().trim(),
    ],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const { name, email, password, phone } = req.body;

            // Vérifier si l'e-mail est déjà utilisé
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Cette adresse e-mail est déjà utilisée.',
                });
            }

            // Créer l'utilisateur (le hash du mot de passe se fait dans le pre-save hook)
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

            const user = await User.create({
                name,
                email,
                password,
                phone,
                emailVerificationToken: hashedToken,
                emailVerificationExpire: Date.now() + 10 * 60 * 1000, // 10 minutes (selon le template)
                isEmailVerified: false,
                role: req.body.role || 'citizen'
            });

            // Envoyer l'email via EmailJS
            const sendVerificationEmail = require('../utils/emailJS');
            // IMPORTANT : Utiliser le window.location.origin du FRONTEND si possible, 
            // ou l'URL Netlify configurée dans CLIENT_URL pour que l'utilisateur 
            // soit redirigé vers le site et non l'API directement.
            const verificationLink = `${process.env.CLIENT_URL || 'https://cs-alert.netlify.app'}/verify-email/${verificationToken}`;
            
            console.log('📧 Tentative d\'envoi d\'email de vérification à:', user.email);
            console.log('🔗 Lien de vérification:', verificationLink);

            try {
                await sendVerificationEmail({
                    name: user.name,
                    email: user.email,
                    verification_link: verificationLink
                });
                console.log('✅ Email de vérification envoyé avec succès via EmailJS');
            } catch (emailError) {
                console.error('❌ Erreur lors de l\'envoi de l\'email EmailJS:', emailError.message);
                // On ne bloque pas l'inscription si l'email échoue en développement, 
                // mais on informe l'utilisateur
            }

            res.status(201).json({
                success: true,
                message: 'Inscription réussie. Veuillez vérifier votre adresse e-mail via le lien envoyé.',
                verificationToken: verificationToken, // Token ajouté pour le frontend
                devLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
            });
        } catch (err) {
            console.error('Erreur register DETAIL :', err);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de l\'inscription.',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
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

            // Récupérer l'utilisateur avec son mot de passe (select: false par défaut)
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'E-mail ou mot de passe incorrect.',
                });
            }

            // Vérifier que le compte est actif
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Votre compte a été désactivé. Contactez un administrateur.',
                });
            }

            // Vérifier si l'adresse email a été vérifiée
            if (!user.isEmailVerified) {
                return res.status(401).json({
                    success: false,
                    message: 'Veuillez vérifier votre adresse e-mail avant de vous connecter.',
                });
            }

            // Comparer le mot de passe
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'E-mail ou mot de passe incorrect.',
                });
            }

            // Mettre à jour la date de dernière connexion
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
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
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

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/update-profile — Mettre à jour son profil
// ─────────────────────────────────────────────────────────────────────────────
router.put(
    '/update-profile',
    protect,
    [
        body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Nom invalide.'),
        body('phone').optional().trim(),
        body('location').optional()
    ],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const { name, phone, location } = req.body;

            // Construire l'objet de mise à jour (champs autorisés uniquement)
            const updates = {};
            if (name) updates.name = name;
            if (phone !== undefined) updates.phone = phone;

            // Allow storing only the coordinates part to preserve address/city if present
            if (location && location.coordinates) {
                updates['location.coordinates'] = location.coordinates;
            }
            if (location && location.address) {
                updates['location.address'] = location.address;
            }
            if (location && location.city) {
                updates['location.city'] = location.city;
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { $set: updates },
                { new: true, runValidators: true }
            );

            res.json({
                success: true,
                message: 'Profil mis à jour avec succès.',
                user: updatedUser,
            });
        } catch (err) {
            console.error('Erreur update-profile :', err.message);
            res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour.' });
        }
    }
);

// POST /api/auth/forgot-password — Demander une réinitialisation
// ─────────────────────────────────────────────────────────────────────────────
router.post(
    '/forgot-password',
    [body('email').isEmail().withMessage('Adresse e-mail invalide.')],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                // Pour éviter le dénombrement d'utilisateurs, on ne dit pas si l'email existe
                return res.json({ success: true, message: 'Si un compte existe pour cet e-mail, un lien de réinitialisation vous a été envoyé.' });
            }

            // Générer un jeton
            const resetToken = crypto.randomBytes(20).toString('hex');
            user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

            await user.save({ validateBeforeSave: false });

            // Simuler l'envoi de l'email (on le log en console et on le renvoie dans la réponse pour le test)
            const resetUrl = `${req.get('origin')}/reset-password/${resetToken}`;
            console.log(`[SIMULATION EMAIL] Réinitialisation demandée pour ${user.email}. URL : ${resetUrl}`);

            res.json({
                success: true,
                message: 'Si un compte existe pour cet e-mail, un lien de réinitialisation vous a été envoyé.',
                // On inclut l'URL UNIQUEMENT pendant le développement ou pour faciliter l'usage ici
                devUrl: resetUrl
            });
        } catch (err) {
            console.error('Erreur forgot-password :', err.message);
            res.status(500).json({ success: false, message: 'Erreur serveur.' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token — Réinitialiser le mot de passe
// ─────────────────────────────────────────────────────────────────────────────
router.post(
    '/reset-password/:token',
    [
        body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.')
            .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),
    ],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            // Rechercher le jeton haché
            const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

            const user = await User.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() },
            });

            if (!user) {
                return res.status(400).json({ success: false, message: 'Jeton de réinitialisation invalide ou expiré.' });
            }

            // Mettre à jour le mot de passe
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            res.json({ success: true, message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
        } catch (err) {
            console.error('Erreur reset-password :', err.message);
            res.status(500).json({ success: false, message: 'Erreur serveur.' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/verify-email/:token — Vérifier l'email via le lien envoyé
// ─────────────────────────────────────────────────────────────────────────────
router.get('/verify-email/:token', async (req, res) => {
    try {
        const token = req.params.token;
        if (!token) {
            return res.status(400).json({ success: false, message: 'Jeton manquant.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Utilisation de findOneAndUpdate pour une opération atomique et plus rapide
        const user = await User.findOneAndUpdate(
            {
                emailVerificationToken: hashedToken,
                emailVerificationExpire: { $gt: Date.now() },
            },
            {
                $set: { isEmailVerified: true },
                $unset: { emailVerificationToken: 1, emailVerificationExpire: 1 }
            },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Le lien de vérification est invalide ou a expiré (validité de 10 minutes).'
            });
        }

        res.json({
            success: true,
            message: 'E-mail vérifié avec succès ! Votre compte est désormais actif.'
        });
    } catch (err) {
        console.error('Erreur verify-email :', err.message);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la vérification.'
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-code — Vérifier le code de vérification envoyé par email
// ─────────────────────────────────────────────────────────────────────────────
router.post(
    '/verify-code',
    [
        body('email').isEmail().withMessage('Adresse e-mail invalide.').normalizeEmail(),
        body('code').isLength({ min: 6, max: 6 }).withMessage('Le code doit contenir 6 chiffres.'),
    ],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const { email, code } = req.body;

            // Hacher le code fourni pour comparer avec celui stocké
            const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

            const user = await User.findOne({
                email,
                emailVerificationCode: hashedCode,
                emailVerificationCodeExpire: { $gt: Date.now() },
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Code invalide ou expiré.',
                });
            }

            // Marquer l'email comme vérifié
            user.isEmailVerified = true;
            user.emailVerificationCode = undefined;
            user.emailVerificationCodeExpire = undefined;
            await user.save({ validateBeforeSave: false });

            // Générer un token pour connecter l'utilisateur immédiatement
            const token = generateToken(user._id);

            res.json({
                success: true,
                message: 'E-mail vérifié avec succès.',
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (err) {
            console.error('Erreur verify-code :', err.message);
            res.status(500).json({ success: false, message: 'Erreur serveur.' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-code — Renvoyer un nouveau code de vérification
// ─────────────────────────────────────────────────────────────────────────────
router.post(
    '/resend-code',
    [body('email').isEmail().withMessage('Adresse e-mail invalide.').normalizeEmail()],
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
            }

            if (user.isEmailVerified) {
                return res.status(400).json({ success: false, message: 'Cet e-mail est déjà vérifié.' });
            }

            // Générer un nouveau code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.emailVerificationCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
            user.emailVerificationCodeExpire = Date.now() + 30 * 60 * 1000;
            await user.save({ validateBeforeSave: false });

            // Renvoyer l'email
            const sendEmail = require('../utils/sendEmail');
            await sendEmail({
                email: user.email,
                subject: 'Nouveau code de vérification CS Alert',
                message: `Voici votre nouveau code de vérification : ${verificationCode}`,
                code: verificationCode
            });

            res.json({
                success: true,
                message: 'Un nouveau code a été envoyé à votre adresse e-mail.',
                devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
            });
        } catch (err) {
            console.error('Erreur resend-code :', err.message);
            res.status(500).json({ success: false, message: 'Erreur serveur.' });
        }
    }
);

module.exports = router;
