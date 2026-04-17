const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/roleMiddleware');

const {
    getDashboardOverview,
    getRecentOrders,
    getLiveInventoryStream,
    getOrderDetails
} = require('../controllers/adminController');

// All endpoints in this file are protected and require the 'admin' role
router.use(protect, adminAuth);

/**
 * @openapi
 * /api/admin/overview:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard overview metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics for revenue, orders, and customers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue: { type: number }
 *                 ordersCount: { type: number }
 *                 customersCount: { type: number }
 *       401:
 *         description: Unauthorized
 */
router.get('/overview', getDashboardOverview);

/**
 * @openapi
 * /api/admin/products/stream:
 *   get:
 *     tags: [Admin]
 *     summary: Get live inventory stream
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of 8 most recent products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/products/stream', getLiveInventoryStream);

/**
 * @openapi
 * /api/admin/orders/recent:
 *   get:
 *     tags: [Admin]
 *     summary: Get recent orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of 10 most recent orders formatted for dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id: { type: string }
 *                   customer: { type: string }
 *                   itemsCount: { type: number }
 *                   location: { type: string }
 *                   totalPrice: { type: number }
 *                   createdAt: { type: string }
 */
router.get('/orders/recent', getRecentOrders);

/**
 * @openapi
 * /api/admin/orders/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get complete order details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed order object with customer and product expansion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 totalAmount: { type: number }
 *                 location: { type: string }
 *                 deliveryType: { type: string, enum: [Urgent, Standard] }
 *                 paymentMethod: { type: string }
 *                 status: { type: string }
 *                 customer:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     email: { type: string }
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name: { type: string }
 *                       quantity: { type: number }
 *                       unitPrice: { type: number }
 *                       imageUrl: { type: string }
 *       404:
 *         description: Order not found
 */
router.get('/orders/:id', getOrderDetails);

module.exports = router;
