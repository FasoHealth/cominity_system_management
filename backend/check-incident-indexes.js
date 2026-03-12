const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/community_security_alert');
        console.log("Connected to DB");
        const indexes = await mongoose.connection.db.collection('incidents').indexes();
        console.log("Indexes on 'incidents' collection:");
        console.log(JSON.stringify(indexes, null, 2));
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        mongoose.disconnect();
    }
}
check();
