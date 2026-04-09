const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Route for User Sign-Up
router.post('/register', registerUser);

// Route for User Login
router.post('/login', loginUser);

module.exports = router;
