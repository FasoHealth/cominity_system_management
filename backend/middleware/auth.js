/**
 * middleware/auth.js — Middlewares d'authentification et d'autorisation
 * Community Security Alert | CS27 - Groupe 16
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — Vérifie que l'utilisateur est authentifié via JWT.
 * Attache l'objet utilisateur à req.user.
 */
const protect = async (req, res, next) => {
    let token;

    // Récupération du token depuis l'en-tête Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Accès refusé. Veuillez vous connecter.',
        });
    }

    try {
        // Vérification et décodage du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Récupération de l'utilisateur depuis la base de données
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur introuvable. Token invalide.',
            });
        }

        // Vérification que le compte est actif
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Votre compte a été désactivé. Contactez un administrateur.',
            });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session expirée. Veuillez vous reconnecter.',
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Token invalide. Veuillez vous reconnecter.',
        });
    }
};

/**
 * adminOnly — Vérifie que l'utilisateur connecté est un administrateur.
 * Doit être utilisé APRÈS le middleware protect.
 */
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Droits administrateur requis.',
        });
    }
    next();
};

/**
 * optionalAuth — Vérifie si un token est présent.
 * Si oui, attache l'utilisateur à req.user. Sinon, continue simplement.
 */
const optionalAuth = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user && user.isActive) {
                req.user = user;
            }
        } catch (err) {
            // Ignorer les erreurs
        }
    }
    next();
};

/**
 * generateToken — Génère un token JWT pour un utilisateur donné.
 * @param {string} id - L'identifiant MongoDB de l'utilisateur
 * @returns {string} Token JWT signé
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

module.exports = { protect, adminOnly, generateToken, optionalAuth };
