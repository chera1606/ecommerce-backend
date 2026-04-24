const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user._id;

    // Validate Input
    if (!rating || !comment) {
        return res.status(400).json({ success: false, message: 'Rating and comment are required.' });
    }

    // 1. Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // 2. Check if user already reviewed this product
    const alreadyReviewed = await Review.findOne({ product: productId, user: userId });
    if (alreadyReviewed) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    // 3. Verify Purchase (AliExpress logic: Must have an Order containing this product, not cancelled)
    const hasBought = await Order.findOne({
        userId: userId,
        'items.productId': productId,
        status: { $ne: 'CANCELLED' }
    });

    if (!hasBought) {
        return res.status(400).json({ 
            success: false, 
            message: 'Purchase required. You can only review items you have bought.' 
        });
    }

    // 4. Create review
    const review = await Review.create({
        product: productId,
        user: userId,
        rating: Number(rating),
        comment,
        isVerifiedPurchase: true
    });

    // 5. Recalculate Average Rating for the Product
    const reviews = await Review.find({ product: productId });
    const numReviews = reviews.length;
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

    product.rating = Number(avgRating.toFixed(1));
    product.numReviews = numReviews;
    await product.save();

    res.status(201).json({ success: true, message: 'Review added successfully', data: review });
});

// @desc    Get all reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
    const productId = req.params.id;

    // Fetch reviews and populate basic user details
    const reviews = await Review.find({ product: productId })
        .populate('user', 'firstName lastName profilePicture')
        .sort('-createdAt'); // Latest first

    if (!reviews) {
        return res.status(404).json({ success: false, message: 'No reviews found.' });
    }

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
    });
});

module.exports = {
    createReview,
    getProductReviews
};
