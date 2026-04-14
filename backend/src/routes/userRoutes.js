const express = require('express');
const router = express.Router();
const { getUsers, updateUserStatus, updateUserRole } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/roleMiddleware');

// All routes are protected and require admin role
router.use(protect, adminAuth);

/**
 * @route   GET /api/admin/users
 * @desc    Get users for admin dashboard (Stats + Paginated List)
 * @access  Private/Admin
 */
router.get('/', getUsers);

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Update user status (Toggle ACTIVE/SUSPENDED)
 * @access  Private/Admin
 */
router.patch('/:id/status', updateUserStatus);

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Update user role (Toggle REGULAR/PRIVILEGED)
 * @access  Private/Admin
 */
router.patch('/:id/role', updateUserRole);

module.exports = router;
