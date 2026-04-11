const jwt = require('jsonwebtoken');

/**
 * Generate Access Token
 * @param {string} id - User ID
 * @returns {string} - Signed JWT
 */
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h',
    });
};

/**
 * Generate Refresh Token
 * @param {string} id - User ID
 * @returns {string} - Signed JWT
 */
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    });
};

/**
 * Verify Token
 * @param {string} token - JWT string
 * @param {boolean} isRefresh - Whether it's a refresh token
 * @returns {object|null} - Decoded payload or null
 */
const verifyToken = (token, isRefresh = false) => {
    try {
        const secret = isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
};
