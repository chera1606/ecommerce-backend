const ProductView = require('../models/ProductView');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get last viewed products
// @route   GET /api/users/last-viewed
const getLastViewed = asyncHandler(async (req, res) => {
    const query = req.user ? { userId: req.user._id } : { sessionId: req.sessionId };

    const lastViewed = await ProductView.find(query)
        .sort({ viewedAt: -1 })
        .limit(5)
        .populate({
            path: 'productId',
            select: 'name price imageUrl rating'
        });

    // Extract products only, avoiding duplicates
    const products = [];
    const productIds = new Set();

    for (const view of lastViewed) {
        if (view.productId && !productIds.has(view.productId._id.toString())) {
            products.push(view.productId);
            productIds.add(view.productId._id.toString());
        }
    }

    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
});

module.exports = {
    getLastViewed
};
