const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all orders with stats and table data
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
const getOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Base match for search
    const matchQuery = {};
    if (search) {
        // Try to match formatted Order ID (QB-XXXX) or User Name
        // For Order ID: match if search starts with QB- and take the rest
        let orderIdMatch = null;
        if (search.toUpperCase().startsWith('QB-')) {
            orderIdMatch = search.slice(3).toUpperCase();
        }

        matchQuery.$or = [
            { "guest": { $regex: search, $options: 'i' } },
            { "orderId": { $regex: search, $options: 'i' } }
        ];
        
        // If it looks like a suffix search, try to match the end of the ID string
        if (orderIdMatch) {
            matchQuery.$or.push({ "orderId": { $regex: orderIdMatch + '$', $options: 'i' } });
        }
    }

    const pipeline = [
        // Join with Users
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
        
        // Handle items - populate first product name for the UI requirement
        {
            $lookup: {
                from: 'products',
                localField: 'items.productId',
                foreignField: '_id',
                as: 'productDetails'
            }
        },

        // Add formatted fields for UI and Search
        {
            $addFields: {
                guest: { 
                    $trim: { 
                        input: { $concat: [{ $ifNull: ['$userDetails.firstName', ''] }, ' ', { $ifNull: ['$userDetails.lastName', ''] }] } 
                    } 
                },
                orderId: { 
                    $concat: [
                        'QB-', 
                        { $toUpper: { $substrCP: [{ $toString: '$_id' }, 20, 4] } } 
                    ] 
                },
                product: { $ifNull: [{ $arrayElemAt: ['$productDetails.name', 0] }, 'Deleted Product'] },
                total: { $ifNull: ['$totalAmount', '$totalPrice'] },
                date: '$createdAt'
            }
        },

        // Apply Search Match
        { $match: matchQuery },

        // Facet for stats and paginated data
        {
            $facet: {
                stats: [
                    {
                        $group: {
                            _id: null,
                            activeShipments: {
                                $sum: { $cond: [{ $eq: ['$status', 'SHIPPED'] }, 1, 0] }
                            },
                            urgentOrders: {
                                $sum: { 
                                    $cond: [
                                        { $and: [{ $eq: ['$priority', true] }, { $ne: ['$status', 'DELIVERED'] }] }, 
                                        1, 
                                        0
                                    ] 
                                }
                            }
                        }
                    }
                ],
                data: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 0,
                            orderId: 1,
                            guest: 1,
                            product: 1,
                            total: 1,
                            date: 1,
                            status: 1,
                            priority: 1
                        }
                    }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ];

    const results = await Order.aggregate(pipeline);
    
    const stats = results[0].stats[0] || { activeShipments: 0, urgentOrders: 0 };
    const data = results[0].data || [];
    const totalOrders = results[0].totalCount[0] ? results[0].totalCount[0].count : 0;

    res.json({
        success: true,
        stats: {
            activeShipments: stats.activeShipments,
            urgentOrders: stats.urgentOrders
        },
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        data
    });
});

/**
 * @desc    Update order status
 * @route   PATCH /api/admin/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid Order ID format" });
    }
    const orderId = req.params.id;

    // Allowed statuses and transition map
    const statuses = ["PENDING", "SHIPPED", "DELIVERED"];
    
    if (!statuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${statuses.join(', ')}`
        });
    }

    const order = await Order.findById(orderId);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }

    const currentStatus = order.status;
    const currentIndex = statuses.indexOf(currentStatus);
    const newIndex = statuses.indexOf(status);

    // Strict transition check: PENDING -> SHIPPED -> DELIVERED
    // 1. Cannot go backwards
    // 2. Cannot skip states
    if (newIndex <= currentIndex) {
        return res.status(400).json({
            success: false,
            message: `Cannot move status back or stay the same. Current: ${currentStatus}, Requested: ${status}`
        });
    }

    if (newIndex !== currentIndex + 1) {
        return res.status(400).json({
            success: false,
            message: `Cannot skip statuses. Must follow: PENDING → SHIPPED → DELIVERED`
        });
    }

    order.status = status;
    await order.save();

    res.json({
        success: true,
        message: 'Order status updated successfully',
        data: {
            status: order.status
        }
    });
});

module.exports = {
    getOrders,
    updateOrderStatus
};
