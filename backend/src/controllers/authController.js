const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '1d',
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Request body is missing. Ensure you are sending JSON and setting Content-Type: application/json' });
    }
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    try {
        // 1. Validation basics
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // 2. Strong password check (example: min 8 length)
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        // 3. Confirm password matches
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // 4. Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // 5. Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password, // Password hashing handled by mongoose pre-save hook
            role: 'user', // Default role
        });

        if (user) {
            res.status(201).json({
                message: 'User registered successfully'
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

/**
 * @desc    Authenticate a user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Request body is missing. Ensure you are sending JSON and setting Content-Type: application/json' });
    }
    const { email, password } = req.body;

    try {
        // Validate inputs
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        // Compare password
        if (user && (await user.matchPassword(password))) {
            res.json({
                id: user._id,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

module.exports = { registerUser, loginUser };
