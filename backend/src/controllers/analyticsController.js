const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get marketing-focused performance analytics
 * @route   GET /api/admin/analytics/performance
 * @access  Private/Admin
 */
const getPerformanceAnalytics = asyncHandler(async (req, res) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. FINANCIAL SUMMARY
    const revenueStats = await Order.aggregate([
        { $match: { status: 'DELIVERED', createdAt: { $gte: sixtyDaysAgo } } },
        {
            $facet: {
                current: [
                    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                    { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } }, count: { $sum: 1 } } }
                ],
                previous: [
                    { $match: { createdAt: { $lt: thirtyDaysAgo } } },
                    { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } } } }
                ]
            }
        }
    ]);

    const revCurrent = revenueStats[0]?.current[0]?.total || 0;
    const ordersCurrent = revenueStats[0]?.current[0]?.count || 0;
    const revPrev = revenueStats[0]?.previous[0]?.total || 0;
    let growthRate = 0;
    if (revPrev > 0) {
        growthRate = Number(((revCurrent - revPrev) / revPrev * 100).toFixed(1));
    } else if (revCurrent > 0) {
        growthRate = 100;
    }

    // 2. REVENUE & ORDER TRENDS (Historical)
    const dailyRevenue = await Order.aggregate([
        { $match: { status: 'DELIVERED', createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%d %b", date: "$createdAt" } },
                revenue: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } },
                orders: { $sum: 1 },
                timestamp: { $first: "$createdAt" }
            }
        },
        { $sort: { timestamp: 1 } },
        { $project: { name: "$_id", revenue: 1, orders: 1, _id: 0 } }
    ]);

    // 3. MARKETING COHORT (New vs Returning)
    // Retention is key for marketing
    const customerOrders = await Order.aggregate([
        { $match: { status: 'DELIVERED' } },
        { $group: { _id: "$userId", orderCount: { $sum: 1 } } }
    ]);

    const returningCount = customerOrders.filter(c => c.orderCount > 1).length;
    const newCount = customerOrders.filter(c => c.orderCount === 1).length;

    const retentionStats = [
        { name: 'Returning', value: returningCount, color: '#10b981' },
        { name: 'New Customers', value: newCount, color: '#3b82f6' }
    ];

    // 4. CUSTOMER ACQUISITION (Signups Growth)
    const dailySignups = await User.aggregate([
        { $match: { role: 'REGULAR', createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%d %b", date: "$createdAt" } },
                count: { $sum: 1 },
                timestamp: { $first: "$createdAt" }
            }
        },
        { $sort: { timestamp: 1 } },
        { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);

    // 5. MARKET SHARE (Category Performance)
    const categoryStats = await Order.aggregate([
        { $match: { status: 'DELIVERED' } },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.productId',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: '$productInfo' },
        {
            $group: {
                _id: '$productInfo.classification',
                revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
            }
        },
        { $sort: { revenue: -1 } }
    ]);

    const totalRev = categoryStats.reduce((acc, cat) => acc + cat.revenue, 0);
    const marketShare = categoryStats.map((cat, i) => ({
        name: cat._id || 'N/A',
        value: cat.revenue,
        percentage: totalRev > 0 ? Math.round((cat.revenue / totalRev) * 100) : 0,
        color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][i % 5]
    })).slice(0, 5);

    // 6. COUNTS
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'REGULAR' });

    res.status(200).json({
        success: true,
        data: {
            kpi: {
                revenue: revCurrent,
                orders: totalOrders,
                customers: totalCustomers,
                growth: growthRate,
                avgOrderValue: ordersCurrent > 0 ? Math.round(revCurrent / ordersCurrent) : 0
            },
            charts: {
                revenueTrends: dailyRevenue.length > 0 ? dailyRevenue : [{ name: 'Start', revenue: 0 }, { name: 'End', revenue: 0 }],
                retention: retentionStats,
                marketShare: marketShare,
                signupGrowth: dailySignups
            }
        }
    });
});

module.exports = {
    getPerformanceAnalytics
};
