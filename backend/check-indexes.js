const mongoose = require('mongoose');
require('dotenv').config();

async function checkIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/community_security_alert');
        console.log("Connected to DB");
        const indexes = await mongoose.connection.db.collection('users').indexes();
        console.log("Indexes on 'users' collection:");
        console.log(JSON.stringify(indexes, null, 2));
    } catch (e) {
        console.error("ERROR CHECKING INDEXES:", e);
    } finally {
        mongoose.disconnect();
    }
}
checkIndexes();
