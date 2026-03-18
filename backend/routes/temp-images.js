const express = require('express');
const router = express.Router();
const path = require('path');

// Route temporaire pour servir les anciennes images locales
// En attendant la migration vers Cloudinary
router.get('/local/:filename', (req, res) => {
    const imagePath = path.join(__dirname, '..', 'uploads', 'incidents', req.params.filename);
    res.sendFile(imagePath, (err) => {
        if (err) {
            console.log('Image non trouvée:', req.params.filename);
            res.status(404).json({ error: 'Image non trouvée' });
        }
    });
});

module.exports = router;
