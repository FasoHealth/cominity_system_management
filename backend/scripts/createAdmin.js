/**
 * scripts/createAdmin.js — Crée ou promeut un utilisateur admin.
 * Usage: node scripts/createAdmin.js <email> <password> <name>
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2] || 'admin@example.com';
const password = process.argv[3] || 'Password123';
const name = process.argv[4] || 'Administrateur';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/community_security_alert';

async function run() {
    try {
        console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        let user = await User.findOne({ email });

        if (user) {
            console.log(`User ${email} already exists. Promoting to admin...`);
            user.role = 'admin';
            user.isActive = true;
            if (process.argv[3]) {
                user.password = password; // Will be hashed by pre-save hook
            }
            await user.save();
            console.log('User promoted successfully.');
        } else {
            console.log(`Creating new admin user: ${name} (${email})...`);
            user = await User.create({
                name,
                email,
                password, // Will be hashed by pre-save hook
                role: 'admin',
                isActive: true
            });
            console.log('Admin user created successfully.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

run();
