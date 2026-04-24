/**
 * @desc    Middleware to authorize admin-level access
 * @usage   Apply after the `protect` middleware so that `req.user` is available
 * @access  Private / Admin
 */
const ADMIN_ROLES = ['ADMIN', 'PRIVILEGED', 'SUPER_ADMIN'];
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

const getRole = (role) => String(role || '').toUpperCase();

const isAdminRole = (role) => ADMIN_ROLES.includes(getRole(role));

const isSuperAdminRole = (role) => getRole(role) === SUPER_ADMIN_ROLE;

const adminAuth = (req, res, next) => {
    // `protect` middleware must run first and attach req.user
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, authentication required'
        });
    }

    if (!isAdminRole(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }

    next();
};

const superAdminAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, authentication required'
        });
    }

    if (!isSuperAdminRole(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Super admin privileges required.'
        });
    }

    next();
};

module.exports = { adminAuth, superAdminAuth, isAdminRole, isSuperAdminRole };
