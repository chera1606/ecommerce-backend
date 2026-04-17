const express = require('express');
const router = express.Router();
const { getOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/roleMiddleware');

// All routes are protected and require admin role
router.use(protect, adminAuth);

/**
 * @route   GET /api/admin/orders
 * @desc    Get orders for admin dashboard (Stats + Transaction Log)
 * @access  Private/Admin
 */
/**
 * @openapi
 * /api/admin/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders for admin dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders with customer and product data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 stats:
 *                   type: object
 *                   properties:
 *                     activeShipments: { type: number }
 *                     urgentOrders: { type: number }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */
router.get('/', getOrders);

/**
 * @openapi
 * /api/admin/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status
 *     description: Strict workflow transition (PENDING -> SHIPPED -> DELIVERED)
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
 *               status: { type: string, enum: [PENDING, SHIPPED, DELIVERED] }
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status transition or missing field
 */
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
