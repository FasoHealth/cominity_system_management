
const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// GET /api/guides — Récupérer tous les guides (avec filtres)
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (search) filter.title = { $regex: search, $options: 'i' };
        const guides = await Guide.find(filter);
        res.json({ success: true, guides });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── Configuration Multer pour guides ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/guides/'),
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
        cb(null, uniqueName);
    },
});
const fileFilter = (req, file, cb) => {
    const allowed = [
        'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format non autorisé. PDF, images, Word seulement.'), false);
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

// GET /api/guides/category/:categoryId — Récupérer le guide pour une catégorie spécifique
router.get('/category/:categoryId', async (req, res, next) => {
    try {
        const guide = await Guide.findOne({ category: req.params.categoryId });

        if (!guide) {
            return res.status(404).json({
                success: false,
                message: "Guide introuvable pour cette catégorie."
            });
        }

        return res.status(200).json({
            success: true,
            data: guide
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/guides/:id/files — Upload de fichiers pour un guide
router.post('/:id/files', upload.array('files', 5), async (req, res) => {
    try {
        const guide = await Guide.findById(req.params.id);
        if (!guide) return res.status(404).json({ success: false, message: 'Guide introuvable.' });
        const files = req.files.map(f => ({
            filename: f.filename,
            originalName: f.originalname,
            path: f.path.replace(/\\/g, '/'),
            size: f.size,
            mimetype: f.mimetype,
        }));
        guide.files = [...(guide.files || []), ...files];
        await guide.save();
        res.json({ success: true, files: guide.files });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
