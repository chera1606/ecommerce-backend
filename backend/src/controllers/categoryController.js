const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all active categories
// @route   GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
    // Fetch all active categories
    const [categories, productStats] = await Promise.all([
        Category.find({ isActive: true }).lean(),
        Product.aggregate([
            { 
                $match: { 
                    imageUrl: { 
                        $nin: [null, '', undefined, 'null', 'undefined'],
                        $not: /^\s*$/ 
                    } 
                } 
            },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ])
    ]);

    const statsMap = {};
    productStats.forEach(stat => {
        if (stat._id) statsMap[stat._id.toString()] = stat.count;
    });

    // Map parent categories and their children
    const categoryMap = {};
    const rootCategories = [];

    // Initialize mapping
    categories.forEach(cat => {
        cat.count = statsMap[cat._id.toString()] || 0;
        cat.children = [];
        categoryMap[cat._id.toString()] = cat;
    });

    // Populate children or root
    categories.forEach(cat => {
        if (cat.parent) {
            const parentId = cat.parent.toString();
            if (categoryMap[parentId]) {
                categoryMap[parentId].children.push(cat);
                // Parent count includes children counts
                categoryMap[parentId].count += (cat.count || 0);
            }
        } else {
            rootCategories.push(cat);
        }
    });

    res.status(200).json({
        success: true,
        count: rootCategories.length,
        data: rootCategories
    });
});

module.exports = {
    getCategories
};
