const mongoose = require('mongoose');

const GuideSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        doList: {
            type: [String],
            default: [],
        },
        dontList: {
            type: [String],
            default: [],
        },
        emergencyNumber: {
            type: String,
            enum: ['15', '17', '18', '112'],
            required: false,
        },
        files: [
            {
                filename: { type: String },
                originalName: { type: String },
                path: { type: String },
                size: { type: Number },
                mimetype: { type: String },
            }
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Guide', GuideSchema);
