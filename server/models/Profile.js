const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    from: { type: Date, required: true },
    to: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String }
});

const educationSchema = new mongoose.Schema({
    school: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    from: { type: Date, required: true },
    to: { type: Date },
    current: { type: Boolean, default: false }
});

const profileSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true 
    },
    headline: { type: String },
    location: { type: String },
    phone: { type: String },
    summary: { type: String },
    skills: { type: [String], default: [] },
    links: {
        portfolio: { type: String },
        linkedin: { type: String },
        github: { type: String }
    },
    experience: [experienceSchema],
    education: [educationSchema]
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);