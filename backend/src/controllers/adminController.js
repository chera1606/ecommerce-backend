const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * @desc    Get dashboard overview metrics
 * @route   GET /api/admin/overview
 * @access  Private/Admin
 */
const getDashboardOverview = async (req, res) => {
    try {
        const [revenueData, ordersCount, customersCount] = await Promise.all([
            Order.aggregate([
                { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
            ]),
            Order.countDocuments(),
            User.countDocuments({ role: 'REGULAR' })
        ]);

        const revenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        res.status(200).json({
            revenue,
            ordersCount,
            customersCount
        });
    } catch (error) {
        console.error("Dashboard overview error:", error);
        res.status(500).json({ message: "Server Error processing dashboard metrics", error: error.message });
    }
};

/**
 * @desc    Get recent orders
 * @route   GET /api/admin/orders/recent
 * @access  Private/Admin
 */
const getRecentOrders = async (req, res) => {
    try {
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'firstName lastName')
            .lean();

        const formattedOrders = recentOrders.map(order => {
            const customerName = order.userId 
                ? `${order.userId.firstName} ${order.userId.lastName}`.trim() 
                : 'Unknown Customer';

            // Calculate items count if items exists, otherwise 0
            const itemsCount = Array.isArray(order.items) 
                ? order.items.reduce((acc, item) => acc + (item.quantity || 1), 0) 
                : 0;

            return {
                _id: order._id,
                customer: customerName,
                itemsCount,
                location: order.location || 'N/A',
                totalPrice: order.totalPrice || 0,
                createdAt: order.createdAt
            };
        });

        res.status(200).json(formattedOrders);
    } catch (error) {
        console.error("Recent orders error:", error);
        res.status(500).json({ message: "Server Error fetching recent orders", error: error.message });
    }
};

/**
 * @desc    Get live inventory stream
 * @route   GET /api/admin/products/stream
 * @access  Private/Admin
 */
const getLiveInventoryStream = async (req, res) => {
    try {
        // Find 8 most recently added products
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .limit(8)
            .select('name price imageUrl stock')
            .lean();

        res.status(200).json(products);
    } catch (error) {
        console.error("Inventory stream error:", error);
        res.status(500).json({ message: "Server Error fetching inventory", error: error.message });
    }
};

/**
 * @desc    Get complete order details
 * @route   GET /api/admin/orders/:id
 * @access  Private/Admin
 */
const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate('userId', 'firstName lastName email')
            .populate('items.productId', 'name price imageUrl')
            .lean();

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const formattedOrder = {
            _id: order._id,
            totalAmount: order.totalPrice,
            location: order.location || 'N/A',
            deliveryType: order.urgentDelivery ? 'Urgent' : 'Standard',
            paymentMethod: order.paymentMethod || 'N/A',
            createdAt: order.createdAt,
            status: order.status || 'Pending',
            customer: order.userId ? {
                id: order.userId._id,
                name: `${order.userId.firstName} ${order.userId.lastName}`.trim(),
                email: order.userId.email
            } : null,
            products: Array.isArray(order.items) ? order.items.map(item => {
                const productInfo = item.productId || {};
                return {
                    name: productInfo.name || 'Unknown Product',
                    quantity: item.quantity,
                    price: productInfo.price || 0,
                    color: item.color || null,
                    imageUrl: productInfo.imageUrl || null
                };
            }) : []
        };

        res.status(200).json(formattedOrder);
    } catch (error) {
        console.error("Order details error:", error);
        res.status(500).json({ message: "Server Error fetching order details", error: error.message });
    }
};

module.exports = {
    getDashboardOverview,
    getRecentOrders,
    getLiveInventoryStream,
    getOrderDetails
};
