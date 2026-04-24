const express = require('express');
// mergeParams: true allows us to access parameters from mounted routes (like /api/products/:id/reviews)
const router = express.Router({ mergeParams: true }); 
const { protect } = require('../middleware/authMiddleware');
const { createReview, getProductReviews } = require('../controllers/reviewController');

/**
 * @openapi
 * /api/products/{id}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews for a product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of reviews
 *   post:
 *     tags: [Reviews]
 *     summary: Create a product review (Requires Auth & Purchase)
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
 *             required: [rating, comment]
 *             properties:
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Review added
 *       400:
 *         description: Already reviewed or Not purchased
 */
router.route('/')
    .get(getProductReviews)
    .post(protect, createReview);

module.exports = router;
