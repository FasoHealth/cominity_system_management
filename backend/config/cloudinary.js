const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL,
        secure: true
    });
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'community-security-alert/incidents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1200, height: 800, crop: 'limit', quality: 'auto:good' }
        ]
    }
});

const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'community-security-alert/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 200, height: 200, crop: 'thumb', gravity: 'face', quality: 'auto:good' }
        ]
    }
});

const messageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'community-security-alert/messages',
        resource_type: 'auto', // Cloudinary décidera du type (image/video/raw)
        transformation: [
            { quality: 'auto' }
        ]
    }
});

module.exports = {
    cloudinary,
    storage,
    avatarStorage,
    messageStorage
};
