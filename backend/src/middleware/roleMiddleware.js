/**
 * @desc    Middleware to authorize admin-only access
 * @usage   Apply after the `protect` middleware so that `req.user` is available
 * @access  Private / Admin
 */
const adminAuth = (req, res, next) => {
    // `protect` middleware must run first and attach req.user
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, authentication required'
        });
    }

    if (!req.user.role || (req.user.role !== 'admin' && req.user.role.toLowerCase() !== 'admin')) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }

    next();
};

module.exports = { adminAuth };
