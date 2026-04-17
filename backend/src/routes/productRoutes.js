const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// All routes below require authentication + admin role
router.use(protect, adminAuth);

/**
 * @openapi
 * /api/admin/products:
 *   get:
 *     tags: [Products]
 *     summary: List all products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products with inventory details
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               sku: { type: string }
 *               classification: { type: string, enum: [SHOES, CLOTHING, ELECTRONICS, ACCESSORIES, CHILDREN, HOME MATERIALS, BEAUTY, FOOTWEAR, APPAREL] }
 *               unitPrice: { type: number }
 *               inventoryLevel: { type: number }
 *               color: { type: string }
 *               specs: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.get('/', getProducts);
router.post('/', upload.single('image'), createProduct);

/**
 * @openapi
 * /api/admin/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update an existing product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               unitPrice: { type: number }
 *               inventoryLevel: { type: number }
 *               color: { type: string }
 *               specs: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Product updated successfully
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
