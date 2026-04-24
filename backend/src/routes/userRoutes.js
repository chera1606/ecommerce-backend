const express = require('express');
const router = express.Router();
const { getUsers, updateUserStatus, updateUserRole } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminAuth, superAdminAuth } = require('../middleware/roleMiddleware');

// All routes are protected
router.use(protect);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users with QB-formatted IDs
 */
router.get('/', adminAuth, getUsers);

/**
 * @openapi
 * /api/admin/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Update user status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, SUSPENDED] }
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status', adminAuth, updateUserStatus);

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Update user role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [REGULAR, PRIVILEGED, ADMIN, SUPER_ADMIN] }
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
router.patch('/:id/role', superAdminAuth, updateUserRole);

module.exports = router;
