const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all active categories
// @route   GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
    // Fetch all active categories
    const categories = await Category.find({ isActive: true }).lean();

    // Map parent categories and their children
    const categoryMap = {};
    const rootCategories = [];

    // Initialize mapping
    categories.forEach(cat => {
        cat.children = [];
        categoryMap[cat._id.toString()] = cat;
    });

    // Populate children or root
    categories.forEach(cat => {
        if (cat.parent) {
            const parentId = cat.parent.toString();
            if (categoryMap[parentId]) {
                categoryMap[parentId].children.push(cat);
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
