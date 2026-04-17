const Product = require('../models/Product');
const Order = require('../models/Order');
const ProductView = require('../models/ProductView');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get recommended products
// @route   GET /api/products/recommended
const getRecommendedProducts = asyncHandler(async (req, res) => {
    // Return products that are featured OR have high rating
    const products = await Product.find({
        $or: [
            { featured: true },
            { rating: { $gte: 4 } }
        ]
    })
    .sort({ rating: -1 })
    .limit(10)
    .populate('category', 'name');

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
});

// @desc    Get top sellers
// @route   GET /api/products/top-sellers
const getTopSellers = asyncHandler(async (req, res) => {
    // Logic: group by productId from Order items, sum quantity
    const topSellers = await Order.aggregate([
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.productId',
                totalSold: { $sum: '$items.quantity' }
            }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' },
        {
            $project: {
                _id: 1,
                totalSold: 1,
                name: '$productDetails.name',
                price: '$productDetails.price',
                imageUrl: '$productDetails.imageUrl',
                rating: '$productDetails.rating',
                category: '$productDetails.category'
            }
        }
    ]);

    res.status(200).json({
        success: true,
        count: topSellers.length,
        data: topSellers
    });
});

// @desc    Get product by ID
// @route   GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category', 'name');

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    // Track View
    await ProductView.create({
        userId: req.user ? req.user._id : null,
        sessionId: req.sessionId,
        productId: product._id
    });

    res.status(200).json({
        success: true,
        data: product
    });
});

module.exports = {
    getRecommendedProducts,
    getTopSellers,
    getProductById
};
