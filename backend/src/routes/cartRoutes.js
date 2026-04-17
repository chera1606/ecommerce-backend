const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require('../controllers/cartController');

// All cart routes require authentication
router.use(protect);

/**
 * @openapi
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current user's cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's cart with items and total price
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId: { type: string }
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           productId:
 *                             type: object
 *                             properties:
 *                               name: { type: string }
 *                               price: { type: number }
 *                           quantity: { type: number }
 *                           price: { type: number }
 *                     totalPrice: { type: number }
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 69e137f1877372476dcf5b6e
 *               quantity:
 *                 type: number
 *                 example: 2
 *               size:
 *                 type: string
 *                 example: "10"
 *               color:
 *                 type: string
 *                 example: Black
 *     responses:
 *       200:
 *         description: Item added to cart
 *       400:
 *         description: Invalid product or quantity
 *   delete:
 *     tags: [Cart]
 *     summary: Clear the entire cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.get('/', getCart);
router.post('/', addToCart);
router.delete('/', clearCart);

/**
 * @openapi
 * /api/cart/{itemId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update quantity of a cart item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *         description: The _id of the item inside cart.items
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated
 *       404:
 *         description: Cart item not found
 *   delete:
 *     tags: [Cart]
 *     summary: Remove a single item from cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *         description: The _id of the item inside cart.items
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);

module.exports = router;
