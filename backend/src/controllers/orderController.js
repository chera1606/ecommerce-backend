const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');

// ═══════════════════════════════════════════════════════════════════════
// ADMIN-FACING ORDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

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

    const matchQuery = {};
    if (search) {
        let orderIdMatch = null;
        if (search.toUpperCase().startsWith('QB-')) {
            orderIdMatch = search.slice(3).toUpperCase();
        }

        matchQuery.$or = [
            { 'guest': { $regex: search, $options: 'i' } },
            { 'orderId': { $regex: search, $options: 'i' } }
        ];

        if (orderIdMatch) {
            matchQuery.$or.push({ 'orderId': { $regex: orderIdMatch + '$', $options: 'i' } });
        }
    }

    const pipeline = [
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'products',
                localField: 'items.productId',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        {
            $addFields: {
                guest: {
                    $trim: {
                        input: {
                            $concat: [
                                { $ifNull: ['$userDetails.firstName', ''] },
                                ' ',
                                { $ifNull: ['$userDetails.lastName', ''] }
                            ]
                        }
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
        { $match: matchQuery },
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
                                        { $and: [{ $eq: ['$urgentDelivery', true] }, { $ne: ['$status', 'DELIVERED'] }] },
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
                            priority: 1,
                            urgentDelivery: 1,
                            paymentMethod: 1,
                            paymentStatus: 1,
                            shippingAddress: 1
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
 * @desc    Update order status  (strict forward-only: PENDING → CONFIRMED → SHIPPED → DELIVERED)
 * @route   PATCH /api/admin/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
    }
    const orderId = req.params.id;

    const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

    if (!statuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${statuses.join(', ')}`
        });
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentIndex = statuses.indexOf(order.status);
    const newIndex = statuses.indexOf(status);

    if (newIndex <= currentIndex) {
        return res.status(400).json({
            success: false,
            message: `Cannot move status backwards. Current: ${order.status}, Requested: ${status}`
        });
    }

    if (newIndex !== currentIndex + 1) {
        return res.status(400).json({
            success: false,
            message: `Cannot skip statuses. Must follow: PENDING → CONFIRMED → SHIPPED → DELIVERED`
        });
    }

    order.status = status;
    await order.save();

    res.json({
        success: true,
        message: 'Order status updated successfully',
        data: { status: order.status }
    });
});

// ═══════════════════════════════════════════════════════════════════════
// USER-FACING ORDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * @desc  Buy Now — direct purchase from the product detail page
 * @route POST /api/orders/buy-now
 * @access Private
 *
 * Body:
 *   productId      {string}  required
 *   quantity       {number}  default 1
 *   size           {string}  optional  (selected size variant)
 *   color          {string}  optional  (selected color variant)
 *   urgentDelivery {boolean} default false  (+$5 fee)
 *   paymentMethod  {string}  TELEBIRR | CHAPA
 *   shippingAddress {object} required
 *     contactName  {string}  required
 *     phone        {string}  required
 *     country      {string}  required
 *     address      {string}  required
 */
const buyNow = asyncHandler(async (req, res) => {
    const {
        productId,
        quantity = 1,
        size,
        color,
        urgentDelivery = false,
        paymentMethod,
        shippingAddress
    } = req.body;

    // ── 1. Validate required fields ──────────────────────────────────
    if (!productId) {
        return res.status(400).json({ success: false, message: 'productId is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid productId format' });
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
        return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
    }

    // ── 2. Validate shippingAddress ──────────────────────────────────
    if (!shippingAddress || typeof shippingAddress !== 'object') {
        return res.status(400).json({ success: false, message: 'shippingAddress is required' });
    }
    const { contactName, phone, country, address } = shippingAddress;
    const missingFields = [];
    if (!contactName || !contactName.trim()) missingFields.push('contactName');
    if (!phone || !phone.trim()) missingFields.push('phone');
    if (!country || !country.trim()) missingFields.push('country');
    if (!address || !address.trim()) missingFields.push('address');
    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Missing required shipping fields: ${missingFields.join(', ')}`
        });
    }

    // ── 3. Validate paymentMethod ────────────────────────────────────
    const allowedPayments = ['TELEBIRR', 'CHAPA'];
    if (!paymentMethod || !allowedPayments.includes(paymentMethod.toUpperCase())) {
        return res.status(400).json({
            success: false,
            message: `paymentMethod is required. Allowed: ${allowedPayments.join(', ')}`
        });
    }

    // ── 4. Load product & check stock ────────────────────────────────
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const stock = product.inventoryLevel ?? product.stock ?? 0;
    const qty = Number(quantity);
    if (stock < qty) {
        return res.status(400).json({
            success: false,
            message: `Only ${stock} item(s) available in stock`
        });
    }

    // ── 5. Validate size & color against product options ─────────────
    if (size && product.sizes && product.sizes.length > 0) {
        if (!product.sizes.includes(size)) {
            return res.status(400).json({
                success: false,
                message: `Invalid size "${size}". Available: ${product.sizes.join(', ')}`
            });
        }
    }
    if (color && product.colors && product.colors.length > 0) {
        if (!product.colors.includes(color)) {
            return res.status(400).json({
                success: false,
                message: `Invalid color "${color}". Available: ${product.colors.join(', ')}`
            });
        }
    }

    // ── 6. Calculate totals ──────────────────────────────────────────
    const unitPrice = product.unitPrice ?? product.price;
    const subtotal = unitPrice * qty;
    const urgentFee = urgentDelivery ? 5 : 0;
    const totalPrice = subtotal + urgentFee;

    // ── 7. Create order ──────────────────────────────────────────────
    const order = await Order.create({
        userId: req.user._id,
        items: [{
            productId: product._id,
            quantity: qty,
            price: unitPrice,
            size: size || undefined,
            color: color || undefined
        }],
        shippingAddress: {
            contactName: contactName.trim(),
            phone: phone.trim(),
            country: country.trim(),
            address: address.trim()
        },
        urgentDelivery: Boolean(urgentDelivery),
        urgentDeliveryFee: urgentFee,
        paymentMethod: paymentMethod.toUpperCase(),
        paymentStatus: 'UNPAID',
        subtotal,
        totalPrice,
        totalAmount: totalPrice,
        status: 'PENDING',
        priority: Boolean(urgentDelivery)
    });

    // ── 8. Deduct inventory ──────────────────────────────────────────
    await Product.findByIdAndUpdate(productId, {
        $inc: {
            inventoryLevel: -qty,
            stock: -qty,
            salesCount: qty
        }
    });

    res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: {
            orderId: order._id,
            status: order.status,
            paymentMethod: order.paymentMethod,
            subtotal: order.subtotal,
            urgentDeliveryFee: order.urgentDeliveryFee,
            totalPrice: order.totalPrice,
            shippingAddress: order.shippingAddress,
            items: order.items,
            createdAt: order.createdAt
        }
    });
});

/**
 * @desc  Checkout — place order from cart items
 * @route POST /api/orders/checkout
 * @access Private
 *
 * Body (all optional, but recommended):
 *   urgentDelivery  {boolean}
 *   paymentMethod   {string}  TELEBIRR | CHAPA
 *   shippingAddress {object}  { contactName, phone, country, address }
 */
const checkoutFromCart = asyncHandler(async (req, res) => {
    const {
        urgentDelivery = false,
        paymentMethod = 'PENDING',
        shippingAddress
    } = req.body;

    // ── 1. Load cart ─────────────────────────────────────────────────
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // ── 2. Validate shippingAddress if provided ───────────────────────
    let validatedAddress = null;
    if (shippingAddress && typeof shippingAddress === 'object') {
        const { contactName, phone, country, address } = shippingAddress;
        const missingFields = [];
        if (!contactName || !contactName.trim()) missingFields.push('contactName');
        if (!phone || !phone.trim()) missingFields.push('phone');
        if (!country || !country.trim()) missingFields.push('country');
        if (!address || !address.trim()) missingFields.push('address');
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required shipping fields: ${missingFields.join(', ')}`
            });
        }
        validatedAddress = {
            contactName: contactName.trim(),
            phone: phone.trim(),
            country: country.trim(),
            address: address.trim()
        };
    }

    // ── 3. Check stock for all items ──────────────────────────────────
    for (const item of cart.items) {
        const product = item.productId;
        if (!product) {
            return res.status(400).json({ success: false, message: 'A product in your cart no longer exists' });
        }
        const stock = product.inventoryLevel ?? product.stock ?? 0;
        if (stock < item.quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock for "${product.name}". Only ${stock} left.`
            });
        }
    }

    // ── 4. Build order items ──────────────────────────────────────────
    const orderItems = cart.items.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.price,
        size: item.size || undefined,
        color: item.color || undefined
    }));

    const subtotal = cart.totalPrice;
    const urgentFee = urgentDelivery ? 5 : 0;
    const totalPrice = subtotal + urgentFee;

    const allowedPayments = ['TELEBIRR', 'CHAPA', 'PENDING'];
    const normalizedPayment = paymentMethod
        ? paymentMethod.toUpperCase()
        : 'PENDING';

    if (!allowedPayments.includes(normalizedPayment)) {
        return res.status(400).json({
            success: false,
            message: `Invalid paymentMethod. Allowed: TELEBIRR, CHAPA`
        });
    }

    // ── 5. Create order ───────────────────────────────────────────────
    const order = await Order.create({
        userId: req.user._id,
        items: orderItems,
        shippingAddress: validatedAddress,
        urgentDelivery: Boolean(urgentDelivery),
        urgentDeliveryFee: urgentFee,
        paymentMethod: normalizedPayment,
        paymentStatus: 'UNPAID',
        subtotal,
        totalPrice,
        totalAmount: totalPrice,
        status: 'PENDING',
        priority: Boolean(urgentDelivery)
    });

    // ── 6. Deduct stock & clear cart ──────────────────────────────────
    for (const item of cart.items) {
        await Product.findByIdAndUpdate(item.productId._id, {
            $inc: {
                inventoryLevel: -item.quantity,
                stock: -item.quantity,
                salesCount: item.quantity
            }
        });
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: {
            orderId: order._id,
            status: order.status,
            paymentMethod: order.paymentMethod,
            subtotal: order.subtotal,
            urgentDeliveryFee: order.urgentDeliveryFee,
            totalPrice: order.totalPrice,
            shippingAddress: order.shippingAddress,
            items: order.items,
            createdAt: order.createdAt
        }
    });
});

/**
 * @desc  Get all orders for the logged-in user
 * @route GET /api/orders/my-orders
 * @access Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .populate('items.productId', 'name unitPrice price imageUrl images sizes colors');

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
    });
});

/**
 * @desc  Get a single order by ID (user can only see their own)
 * @route GET /api/orders/:id
 * @access Private
 */
const getOrderById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
    }
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id })
        .populate('items.productId', 'name unitPrice price imageUrl images sizes colors');

    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
});

/**
 * @desc  Cancel a pending order (user can only cancel their own PENDING orders)
 * @route PATCH /api/orders/:id/cancel
 * @access Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid Order ID format' });
    }
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'PENDING') {
        return res.status(400).json({
            success: false,
            message: `Cannot cancel an order with status "${order.status}". Only PENDING orders can be cancelled.`
        });
    }

    // Restore inventory
    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
            $inc: {
                inventoryLevel: item.quantity,
                stock: item.quantity,
                salesCount: -item.quantity
            }
        });
    }

    order.status = 'CANCELLED';
    await order.save();

    res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: { status: order.status }
    });
});

module.exports = {
    // Admin
    getOrders,
    updateOrderStatus,
    // User-facing
    buyNow,
    checkoutFromCart,
    getMyOrders,
    getOrderById,
    cancelOrder
};
