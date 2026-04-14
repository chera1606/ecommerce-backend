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
router.get('/', getOrders);

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Update order status (Strict PENDING -> SHIPPED -> DELIVERED)
 * @access  Private/Admin
 */
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
