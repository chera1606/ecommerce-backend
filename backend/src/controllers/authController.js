const crypto = require('crypto');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/tokenService');
const sendEmail = require('../utils/emailService');
const { generateOTP } = require('../utils/otpUtility');
const { otpEmailTemplate, passwordResetTemplate } = require('../utils/mailTemplates');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'Request body is missing' });
    }

    const { firstName, lastName, email, password, confirmPassword } = req.body;

    try {
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password
        });

        return res.status(201).json({
            success: true,
            message: 'Registration successful. You can now login.'
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};



/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            // Store refresh token in user document
            user.refreshToken = refreshToken;
            await user.save();

            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    accessToken,
                    refreshToken
                }
            });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    try {
        const decoded = verifyToken(token, true);
        if (!decoded) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== token) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token mapping' });
        }

        const newAccessToken = generateAccessToken(user._id);
        return res.json({ success: true, data: { accessToken: newAccessToken } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.refreshToken = undefined;
        await user.save();

        return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Forgot password (OTP-based)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate 6-digit OTP for password reset
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await user.save();

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset OTP',
                message: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
                html: passwordResetTemplate(otp, user.firstName)
            });

            return res.json({ success: true, message: 'Password reset OTP sent to your email' });
        } catch (err) {
            console.error('Forgot Password Email error:', err);
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Reset password using OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    try {
        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Validate OTP
        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (!user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        // Update password securely (Hashing is handled by User model pre-save hook)
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return res.json({ success: true, message: 'Password reset successful. You can now login.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    forgotPassword,
    resetPassword
};
