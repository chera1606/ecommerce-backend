const express = require('express');
const router = express.Router();
const { getPerformanceAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/roleMiddleware');

// All analytics endpoints require Administrator clearance
router.use(protect, adminAuth);

/**
 * @route   GET /api/admin/analytics/performance
 * @desc    Fetch heavy dynamic DB-driven aggregation analytics payload representing the Performance Dashboard GUI.
 * @access  Private/Admin
 */
router.get('/performance', getPerformanceAnalytics);

module.exports = router;
