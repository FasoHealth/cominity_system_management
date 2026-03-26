

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

// ── Création des dossiers d'uploads si absents ──────────────────────────────
const uploadDirs = ['uploads', 'uploads/incidents', 'uploads/avatars'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Dossier créé : ${dir}`);
  }
});

// ── Import des routes ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');

const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notification.routes');
const messageRoutes = require('./routes/messages');
const supportRoutes = require('./routes/support');
const tempImagesRoutes = require('./routes/temp-images');
const adminRoutes = require('./routes/admin.routes');


// ── Documentation Swagger ───────────────────────────────────────────────────
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');


const app = express();

// ── Middlewares globaux ───────────────────────────────────────────────────────
const allowedOrigins = [
  'https://security-allert.netlify.app',
  'https://cs-alert.netlify.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS bloqué pour cette origine'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Route de Documentation API (Swagger) ─────────────────────────────────────
const customCss = `
.swagger-ui .topbar { background-color: #E8453C; }
.swagger-ui .info .title { color: #E8453C; }
.swagger-ui .btn.authorize { background-color: #E8453C; border-color: #E8453C; color: white; }
.swagger-ui .btn.authorize svg { fill: white; }
`;
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss }));

// ── Exposition du dossier uploads (images statiques) ─────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes API ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/support', supportRoutes);
app.use('/uploads/incidents', tempImagesRoutes); // Route temporaire pour anciennes images

// ── Route de santé ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Community Security Alert API opérationnelle',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Middleware de gestion des routes inconnues ────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.originalUrl}`,
  });
});

// ── Middleware de gestion des erreurs globales ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('--- ERREUR SERVEUR ---');
  console.error('PROVENANCE :', req.originalUrl);
  console.error('ERREUR :', err.message || err);
  if (err.stack) console.error('STACK :', err.stack);

  // Erreur Multer spécifique
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fichier trop volumineux. La limite est de 10 Mo.',
    });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Trop de fichiers simultanés.',
    });
  }

  // Si c'est une erreur de Multer ou Cloudinary (souvent un 400)
  if (err.name === 'MulterError' || err.http_code === 400 || err.message?.includes('multer')) {
    return res.status(400).json({
      success: false,
      message: `Erreur de téléchargement : ${err.message}`,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur.',
  });
});

// ── Connexion MongoDB puis démarrage du serveur ───────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/community_security_alert';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connexion MongoDB réussie');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur démarré sur http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB :', err.message);
    process.exit(1);
  });
