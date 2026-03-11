const jwt = require('jsonwebtoken');

function generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
}

try {
    generateToken('12345');
    console.log("Token generated successfully");
} catch (e) {
    console.error("Error generating token:", e);
}
