const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/community_security_alert');
        console.log("Connected to DB");
        const user = await User.create({
            name: "Test User",
            email: "test" + Date.now() + "@example.com",
            password: "password1",
            phone: ""
        });
        console.log("User created:", user);
    } catch (e) {
        console.error("ERROR CREATING USER:", e);
    } finally {
        mongoose.disconnect();
    }
}
test();
