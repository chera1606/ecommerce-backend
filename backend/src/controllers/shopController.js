const Product = require('../models/Product');
const Category = require('../models/Category'); // Added to fetch subcategories
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all products with filtering, sorting, pagination (Shop Page)
// @route   GET /api/shop/products
const getShopProducts = asyncHandler(async (req, res) => {
    const {
        search,
        category,
        minPrice,
        maxPrice,
        sort = 'newest',
        page = 1,
        limit = 12,
        featured,
        sizes,
        colors
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter query
    const filter = {};

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    if (category) {
        // Find if this category has children
        const subcategories = await Category.find({ parent: category }).select('_id');
        const categoryIds = [category, ...subcategories.map(c => c._id.toString())];
        
        filter.category = { $in: categoryIds };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (featured === 'true') {
        filter.featured = true;
    }

    if (sizes) {
        const sizeArray = sizes.split(',').map(s => s.trim());
        filter.sizes = { $in: sizeArray };
    }

    if (colors) {
        const colorArray = colors.split(',').map(c => c.trim());
        filter.colors = { $in: colorArray };
    }

    // Build sort option
    let sortOption = {};
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else sortOption = { createdAt: -1 }; // newest default

    const [products, totalCount] = await Promise.all([
        Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNumber)
            .populate('category', 'name'),
        Product.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        page: pageNumber,
        limit: limitNumber,
        totalProducts: totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        data: products
    });
});

module.exports = { getShopProducts };
