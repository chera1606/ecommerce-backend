const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get performance analytics for the admin dashboard
 * @route   GET /api/admin/analytics/performance
 * @access  Private/Admin
 */
const getPerformanceAnalytics = asyncHandler(async (req, res) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. REVENUE CALCULATION (Delivered Orders Only)
    const revenueStats = await Order.aggregate([
        { $match: { status: 'DELIVERED', createdAt: { $gte: sixtyDaysAgo } } },
        {
            $facet: {
                current: [
                    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                    { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } } } }
                ],
                previous: [
                    { $match: { createdAt: { $lt: thirtyDaysAgo } } },
                    { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$totalPrice'] } } } }
                ]
            }
        }
    ]);

    const revCurrent = revenueStats[0]?.current[0]?.total || 0;
    const revPrev = revenueStats[0]?.previous[0]?.total || 0;
    let growthRate = 0;
    if (revPrev > 0) {
        growthRate = Number(((revCurrent - revPrev) / revPrev * 100).toFixed(2));
    } else if (revCurrent > 0) {
        growthRate = 100;
    }

    // 2. TOP CATEGORIES (Derived from Real Sales)
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
                soldQuantity: { $sum: '$items.quantity' }
            }
        }
    ]);

    const totalSold = categoryStats.reduce((acc, cat) => acc + cat.soldQuantity, 0);
    const topCategories = categoryStats
        .map(cat => ({
            name: cat._id || 'UNCATEGORIZED',
            percentage: totalSold > 0 ? Math.round((cat.soldQuantity / totalSold) * 100) : 0
        }))
        .sort((a, b) => b.percentage - a.percentage);

    // 3. ASSET VELOCITY (Real Sales Frequency)
    // First, get sales rate for each product in the last 30 days
    const dailySalesStats = await Order.aggregate([
        { $match: { status: 'DELIVERED', createdAt: { $gte: thirtyDaysAgo } } },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.productId',
                totalSold: { $sum: '$items.quantity' }
            }
        },
        {
            $project: {
                dailySalesRate: { $divide: ['$totalSold', 30] }
            }
        }
    ]);

    // Map sales rate to products for easy lookup
    const salesRateMap = new Map(dailySalesStats.map(s => [s._id.toString(), s.dailySalesRate]));

    // 4. INVENTORY & PRODUCT LIST (Product Collection Only)
    const inventoryStats = await Product.aggregate([
        {
            $group: {
                _id: null,
                totalValue: { $sum: { $multiply: ['$inventoryLevel', '$unitPrice'] } }
            }
        }
    ]);

    const allProducts = await Product.find().lean();
    
    const productsList = allProducts.map(p => ({
        id: `#QB-${p._id.toString().slice(-4).toUpperCase()}`,
        name: p.name,
        color: p.color || 'N/A',
        inventoryLevel: p.inventoryLevel,
        unitPrice: p.unitPrice,
        thumbnail: p.imageUrl || '',
        isLowStock: p.inventoryLevel < 5
    }));

    // Calculate Velocity for Top Items
    const assetVelocity = allProducts
        .map(p => {
            const rate = salesRateMap.get(p._id.toString()) || 0;
            return {
                productName: p.name,
                dailySalesRate: rate,
                inventoryChurnDays: rate > 0 ? Math.ceil(p.inventoryLevel / rate) : null
            };
        })
        .filter(p => p.dailySalesRate > 0) // Only show items with real movement
        .sort((a, b) => (a.inventoryChurnDays || Infinity) - (b.inventoryChurnDays || Infinity))
        .slice(0, 5)
        .map(v => ({
            productName: v.productName,
            inventoryChurnDays: v.inventoryChurnDays,
            statusColor: v.inventoryChurnDays < 15 ? 'red' : (v.inventoryChurnDays < 45 ? 'black' : 'gray')
        }));

    // 5. COUNTS FOR SUMMARY CARDS
    const [ordersCount, customersCount] = await Promise.all([
        Order.countDocuments(),
        User.countDocuments({ role: 'REGULAR' })
    ]);

    // 6. ASSEMBLE RESPONSE FOR Analytics.jsx
    res.json({
        revenue: revCurrent,
        orders: ordersCount,
        customers: customersCount,
        growth: growthRate >= 0 ? `+${growthRate}%` : `${growthRate}%`,
        recentRevenue: revCurrent,
        categories: topCategories.map((c, i) => ({
            ...c,
            color: ['bg-violet-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500', 'bg-emerald-500'][i % 5]
        })),
        topProducts: allProducts
            .filter(p => (salesRateMap.get(p._id.toString()) || 0) > 0)
            .map(p => ({
                id: p._id,
                name: p.name,
                sales: Math.round((salesRateMap.get(p._id.toString()) || 0) * 30),
                image: p.imageUrl
            }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 4),
        // Keep legacy nested structure for backward compatibility/other clients
        success: true,
        data: {
            revenue: {
                total: revCurrent,
                currency: "USD",
                growthRate,
                hasData: revCurrent > 0
            },
            topCategories: topCategories,
            assetVelocity: assetVelocity,
            inventory: {
                totalValue: inventoryStats[0]?.totalValue || 0,
                currency: "USD"
            }
        }
    });
});

module.exports = {
    getPerformanceAnalytics
};
