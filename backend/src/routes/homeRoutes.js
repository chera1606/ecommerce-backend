const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/authMiddleware');

const { 
    getRecommendedProducts, 
    getTopSellers, 
    getProductById 
} = require('../controllers/homeProductController');

const { getCategories } = require('../controllers/categoryController');
const { subscribeNewsletter } = require('../controllers/newsletterController');
const { getLastViewed } = require('../controllers/userActivityController');
const { getShopProducts } = require('../controllers/shopController');

/**
 * @openapi
 * /api/categories:
 *   get:
 *     tags: [Home]
 *     summary: Get all product categories
 *     security: []
 *     responses:
 *       200:
 *         description: List of active categories
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
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/categories', getCategories);

/**
 * @openapi
 * /api/products/recommended:
 *   get:
 *     tags: [Home]
 *     summary: Get recommended/featured products
 *     security: []
 *     responses:
 *       200:
 *         description: List of featured products
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
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/products/recommended', getRecommendedProducts);

/**
 * @openapi
 * /api/products/top-sellers:
 *   get:
 *     tags: [Home]
 *     summary: Get top-selling products by total units sold
 *     security: []
 *     responses:
 *       200:
 *         description: Top selling products list
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
 *                     $ref: '#/components/schemas/Product'
 *                 totalSoldData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string }
 *                       totalSold: { type: number }
 */
router.get('/products/top-sellers', getTopSellers);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Home]
 *     summary: Get a single product's full details
 *     description: Also tracks the view via session cookie for last-viewed history.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the product
 *     responses:
 *       200:
 *         description: Full product detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/products/:id', optionalProtect, getProductById);

/**
 * @openapi
 * /api/users/last-viewed:
 *   get:
 *     tags: [Home]
 *     summary: Get recently viewed products
 *     description: Uses session cookie for guests; Bearer token for logged-in users.
 *     security: []
 *     responses:
 *       200:
 *         description: List of recently viewed products
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
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/users/last-viewed', optionalProtect, getLastViewed);

/**
 * @openapi
 * /api/newsletter/subscribe:
 *   post:
 *     tags: [Home]
 *     summary: Subscribe to newsletter
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *     responses:
 *       200:
 *         description: Subscribed successfully
 *       400:
 *         description: Email already subscribed
 */
router.post('/newsletter/subscribe', subscribeNewsletter);

/**
 * @openapi
 * /api/shop/products:
 *   get:
 *     tags: [Shop]
 *     summary: Get shop products with filters, sorting and pagination
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or description
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by category ObjectId
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *         example: 20
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *         example: 300
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, rating]
 *       - in: query
 *         name: page
 *         schema: { type: number }
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema: { type: number }
 *         example: 12
 *       - in: query
 *         name: sizes
 *         schema: { type: string }
 *         description: Comma-separated sizes (e.g. S,M,L)
 *       - in: query
 *         name: colors
 *         schema: { type: string }
 *         description: Comma-separated colors (e.g. Red,Black)
 *       - in: query
 *         name: featured
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 page: { type: number }
 *                 limit: { type: number }
 *                 totalProducts: { type: number }
 *                 totalPages: { type: number }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/shop/products', getShopProducts);

module.exports = router;
