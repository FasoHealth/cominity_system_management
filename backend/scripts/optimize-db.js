/**
 * backend/scripts/optimize-db.js
 * Script pour créer les index MongoDB nécessaires à la performance
 * Community Security Alert
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

async function optimize() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/community_security_alert';
        console.log(`Connecting to ${uri}...`);
        await mongoose.connect(uri);
        console.log("Connected to MongoDB.");

        const Incident = mongoose.model('Incident', new mongoose.Schema({}));
        const User = mongoose.model('User', new mongoose.Schema({}));

        console.log("Creating indexes on 'incidents'...");
        // Index sur le statut (très filtré)
        await Incident.collection.createIndex({ status: 1 });
        // Index sur la date (pour les tendances et le fil récent)
        await Incident.collection.createIndex({ createdAt: -1 });
        // Index géospatial (pour la proximité des notifications)
        await Incident.collection.createIndex({ location: "2dsphere" });
        // Index composé pour les filtres complexes (statut + catégorie)
        await Incident.collection.createIndex({ status: 1, category: 1 });
        // Index de recherche textuelle
        await Incident.collection.createIndex({
            title: "text",
            description: "text",
            "location.address": "text"
        }, {
            weights: { title: 10, description: 5, "location.address": 2 },
            name: "IncidentSearchIndex"
        });

        console.log("Creating indexes on 'users'...");
        // Index unique sur l'email (déjà normalement géré par Mongoose mais par sécurité)
        await User.collection.createIndex({ email: 1 }, { unique: true });
        // Index sur le rôle
        await User.collection.createIndex({ role: 1 });

        console.log("✅ All indexes created successfully!");
    } catch (err) {
        console.error("❌ Error optimizing database:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

optimize();
