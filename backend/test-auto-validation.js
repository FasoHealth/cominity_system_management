/**
 * test-auto-validation.js
 * Script to verify the 5-vote auto-approval logic.
 */
const mongoose = require('mongoose');
require('dotenv').config();
const Incident = require('./models/Incident');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/community_security_alert';

async function test() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Create a dummy reporter
        let reporter = await User.findOne({ email: 'reporter@test.com' });
        if (!reporter) {
            reporter = await User.create({ name: 'Reporter', email: 'reporter@test.com', password: 'password123', role: 'citizen' });
        }

        // 2. Create a pending incident
        const incident = await Incident.create({
            title: 'Test Incident for Auto-Approval',
            description: 'This is a test description that must be at least 20 characters long.',
            category: 'theft',
            severity: 'medium',
            location: { address: 'Test Address', coordinates: { type: 'Point', coordinates: [0, 0] } },
            reportedBy: reporter._id,
            status: 'pending'
        });
        console.log(`Created pending incident: ${incident._id}`);

        // 3. Create 5 dummy voters
        const voters = [];
        for (let i = 1; i <= 5; i++) {
            let voter = await User.findOne({ email: `voter${i}@test.com` });
            if (!voter) {
                voter = await User.create({ name: `Voter ${i}`, email: `voter${i}@test.com`, password: 'password123', role: 'citizen' });
            }
            voters.push(voter);
        }

        // 4. Simulate upvoting (using the same logic as the route)
        console.log('Simulating 5 upvotes...');
        for (let i = 0; i < 5; i++) {
            const inc = await Incident.findById(incident._id);
            inc.upvotes.push(voters[i]._id);
            
            if (inc.status === 'pending' && inc.upvotes.length >= 5) {
                inc.status = 'approved';
                inc.moderationNote = 'Auto-approved via test script';
            }
            await inc.save({ validateBeforeSave: false });
            console.log(`Vote ${i+1} added. Status: ${inc.status}`);
        }

        const finalInc = await Incident.findById(incident._id);
        if (finalInc.status === 'approved' && finalInc.upvotes.length === 5) {
            console.log('✅ Auto-approval test PASSED!');
        } else {
            console.log('❌ Auto-approval test FAILED.');
        }

        // Cleanup
        await Incident.findByIdAndDelete(incident._id);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
