const express = require('express');
const router = express.Router();
const { getUsers, updateUserStatus, updateUserRole } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/roleMiddleware');

// All routes are protected and require admin role
router.use(protect, adminAuth);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users with QB-formatted IDs
 */
router.get('/', getUsers);

/**
 * @openapi
 * /api/admin/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Update user status
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
 *               status: { type: string, enum: [ACTIVE, SUSPENDED, PENDING] }
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status', updateUserStatus);

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Update user role
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
 *               role: { type: string, enum: [REGULAR, PRIVILEGED, ADMIN] }
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
router.patch('/:id/role', updateUserRole);

module.exports = router;
