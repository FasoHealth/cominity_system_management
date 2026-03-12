const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
    console.error("DOTENV ERROR:", result.error);
} else {
    console.log("DOTENV PARSED SUCCESSFULLY");
    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    console.log("PORT:", process.env.PORT);
}
