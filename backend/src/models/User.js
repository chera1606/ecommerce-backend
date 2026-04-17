const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userAddressSchema = new mongoose.Schema({
    contactName: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    role: {
        type: String,
        enum: ['REGULAR', 'PRIVILEGED', 'ADMIN'],
        default: 'REGULAR'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    otp: String,
    otpExpires: Date,
    refreshToken: String,
    profilePicture: {
        type: String,
        default: ''
    },
    addresses: [userAddressSchema]
}, { timestamps: true });

// Hash password before saving to the database
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
