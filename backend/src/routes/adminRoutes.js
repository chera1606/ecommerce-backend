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

// Dashboard Overview
router.get('/overview', getDashboardOverview);

// Products Dashboard Stream
router.get('/products/stream', getLiveInventoryStream);

// Orders Dashboards
router.get('/orders/recent', getRecentOrders);
router.get('/orders/:id', getOrderDetails);

module.exports = router;
