const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: "Full Name is required"
    },
    email: {
        type: String,
        trim: true,
        required: "Email is required",
        unique: true,
        lowercase: true
    },
    profileImage: {
        type: String, // optional now
        default: ""
    },
    phone: {
        type: String,
        trim: true,
        required: "Phone number is required",
        unique: true
    },
    password: {
        type: String,
        trim: true,
        required: "Password is required"
    }
}, {
    timestamps: true
});

const passwordSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true }
});

const userModel = mongoose.model('User', userSchema); // users
const passwordModel = mongoose.model('Password', passwordSchema); // passwords

module.exports = { userModel, passwordModel };
