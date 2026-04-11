const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Private Routes
router.post('/logout', protect, logoutUser);

module.exports = router;
