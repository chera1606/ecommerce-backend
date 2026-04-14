const express = require('express');
const router = express.Router();
const { getPerformanceAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/roleMiddleware');

// All analytics endpoints require Administrator clearance
router.use(protect, adminAuth);

/**
 * @openapi
 * /api/admin/analytics/performance:
 *   get:
 *     tags: [Analytics]
 *     summary: Fetch performance dashboard analytics
 *     description: Returns a comprehensive payload including revenue trends, top categories, asset velocity, and inventory value.
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         total: { type: number }
 *                         currency: { type: string }
 *                         growthRate: { type: number }
 *                     topCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name: { type: string }
 *                           percentage: { type: number }
 *                     assetVelocity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productName: { type: string }
 *                           inventoryChurnDays: { type: number }
 *                           statusColor: { type: string }
 *                     inventory:
 *                       type: object
 *                       properties:
 *                         totalValue: { type: number }
 *                         currency: { type: string }
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get('/performance', getPerformanceAnalytics);

module.exports = router;
