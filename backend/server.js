/**
 * server.js — Point d'entrée principal du backend
 * Community Security Alert | CS27 - Groupe 16
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ── Import des routes ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');

const app = express();

// ── Middlewares globaux ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

// Configuration CORS plus flexible pour la production et le développement
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000'
    ].filter(Boolean);

    // Autoriser les requêtes sans origine (comme les apps mobiles ou Postman)
    if (!origin) return callback(null, true);

    // Vérifier si l'origine est dans la liste ou est un localhost (pour le dev)
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isNetlify = origin.endsWith('.netlify.app');

    if (allowedOrigins.indexOf(origin) !== -1 || isLocalhost || isNetlify) {
      callback(null, true);
    } else {
      console.log('CORS bloqué pour l\'origine :', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Exposition du dossier uploads (images statiques) ─────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes API ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// ── Route de santé ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Community Security Alert API opérationnelle',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Servir le frontend React (même port) ───────────────────────────────────────
const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// ── Middleware de gestion des routes inconnues ────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.originalUrl}`,
  });
});

// ── Middleware de gestion des erreurs globales ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err.stack);

  // Erreur Multer spécifique
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fichier trop volumineux. La limite est de 5 Mo par image.',
    });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Trop de fichiers. Maximum 4 images par signalement.',
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur.',
  });
});

// ── Connexion MongoDB puis démarrage du serveur ───────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/community_security_alert';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connexion MongoDB réussie');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB :', err.message);
    process.exit(1);
  });
