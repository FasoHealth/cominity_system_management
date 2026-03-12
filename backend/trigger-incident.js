const mongoose = require('mongoose');
const Incident = require('./models/Incident');
require('dotenv').config();

async function testIncident() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/community_security_alert');
        console.log("Connected to DB");
        
        const incidentData = {
            title: "Test Incident Creation",
            description: "This is a test description that is long enough to pass validation.",
            category: "theft",
            severity: "medium",
            location: {
                address: "Test Address GeoJSON",
                city: "Ouagadougou",
                coordinates: {
                    type: "Point",
                    coordinates: [-1.53, 12.37] // [lng, lat]
                }
            },
            reportedBy: "69b19bc01942582048cb1b1f", // Valid ID from previous test
            status: "pending"
        };

        console.log("Creating incident...");
        const inc = await Incident.create(incidentData);
        console.log("SUCCESS:", inc._id);
    } catch (e) {
        console.error("ERROR CREATING INCIDENT:", e);
    } finally {
        mongoose.disconnect();
    }
}
testIncident();
