const User = require('../models/User');
const { verifyToken } = require('../utils/tokenService');

/**
 * @desc    Middleware to protect routes (JWT Access Token required)
 * @access  Private
 */
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify access token
            const decoded = verifyToken(token);

            if (!decoded) {
                return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
            }

            // Find user from decoded ID
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User no longer exists' });
            }

            // Important: return next() to ensure function stops here
            return next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    // If no token was found at all
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }
};

/**
 * @desc    Middleware to optionally populate req.user (Doesn't block guest users)
 * @access  Public
 */
const optionalProtect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = verifyToken(token);
            if (decoded) {
                req.user = await User.findById(decoded.id).select('-password');
            }
        } catch (error) {
            // Ignore token failure for optional auth
        }
    }
    next();
};

module.exports = { protect, optionalProtect };
