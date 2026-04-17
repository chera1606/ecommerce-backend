const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    buyNow,
    checkoutFromCart,
    getMyOrders,
    getOrderById,
    cancelOrder
} = require('../controllers/orderController');

// All user order routes require authentication
router.use(protect);

/**
 * @openapi
 * /api/orders/my-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders for the logged-in user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: number }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
router.get('/my-orders', getMyOrders);

/**
 * @openapi
 * /api/orders/buy-now:
 *   post:
 *     tags: [Orders]
 *     summary: Buy Now — direct purchase from the product detail page
 *     description: |
 *       Places a direct order for a single product without using the cart.
 *       Requires shipping address (free-text, not a dropdown), size/color selection,
 *       urgent delivery option, and payment method.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, shippingAddress, paymentMethod]
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "6631a2b9cde1234567890abc"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 example: 2
 *               size:
 *                 type: string
 *                 example: "M"
 *                 description: Must match one of the product's available sizes
 *               color:
 *                 type: string
 *                 example: "STANDARD BLACK"
 *                 description: Must match one of the product's available colors
 *               urgentDelivery:
 *                 type: boolean
 *                 default: false
 *                 description: Adds $5.00 urgent delivery fee
 *               paymentMethod:
 *                 type: string
 *                 enum: [TELEBIRR, CHAPA]
 *                 example: "TELEBIRR"
 *               shippingAddress:
 *                 type: object
 *                 required: [contactName, phone, country, address]
 *                 properties:
 *                   contactName:
 *                     type: string
 *                     example: "Abebe Girma"
 *                   phone:
 *                     type: string
 *                     example: "+251911234567"
 *                   country:
 *                     type: string
 *                     example: "Ethiopia"
 *                   address:
 *                     type: string
 *                     example: "Bole Road, Addis Ababa"
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId: { type: string }
 *                     status: { type: string }
 *                     paymentMethod: { type: string }
 *                     subtotal: { type: number }
 *                     urgentDeliveryFee: { type: number }
 *                     totalPrice: { type: number }
 *                     shippingAddress: { type: object }
 *                     items: { type: array }
 *                     createdAt: { type: string, format: date-time }
 *       400:
 *         description: Validation error (missing fields, insufficient stock, invalid size/color)
 *       404:
 *         description: Product not found
 */
router.post('/buy-now', buyNow);

/**
 * @openapi
 * /api/orders/checkout:
 *   post:
 *     tags: [Orders]
 *     summary: Checkout from cart — place order using all current cart items
 *     description: |
 *       Converts all cart items into a single order, clears the cart,
 *       and deducts inventory. Accepts optional shipping address,
 *       urgent delivery and payment method.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               urgentDelivery:
 *                 type: boolean
 *                 default: false
 *               paymentMethod:
 *                 type: string
 *                 enum: [TELEBIRR, CHAPA]
 *                 example: "CHAPA"
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   contactName: { type: string, example: "Abebe Girma" }
 *                   phone: { type: string, example: "+251911234567" }
 *                   country: { type: string, example: "Ethiopia" }
 *                   address: { type: string, example: "Bole Road, Addis Ababa" }
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Cart is empty or stock insufficient
 */
router.post('/checkout', checkoutFromCart);

/**
 * @openapi
 * /api/orders/{id}/cancel:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel a PENDING order (restores inventory)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Order ObjectId
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Cannot cancel non-PENDING order
 *       404:
 *         description: Order not found
 */
router.patch('/:id/cancel', cancelOrder);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get a single order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Order ObjectId
 *     responses:
 *       200:
 *         description: Full order detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get('/:id', getOrderById);

module.exports = router;
