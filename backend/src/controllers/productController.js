const Product = require('../models/Product');
const ProductLog = require('../models/ProductLog');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');

/**
 * @desc    Helper for background audit logging
 */
const logProductChange = async (productId, adminId, action, oldValue, newValue) => {
    try {
        await ProductLog.create({ productId, adminId, action, oldValue, newValue });
    } catch (error) {
        console.error('Audit Logging Error:', error.message);
    }
};

/**
 * @desc    Helper to generate unique SKU
 */
const generateSKU = () => {
    return `SKU-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

/**
 * @desc    Get all products with advanced filtering, sorting, and stats
 * @route   GET /api/admin/products
 */
const getProducts = asyncHandler(async (req, res) => {
    const { search, classification, minPrice, maxPrice, sort, page = 1, limit = 10, stockStatus } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let matchQuery = {};
    if (search) matchQuery.name = { $regex: search, $options: 'i' };
    if (classification && classification !== 'ALL') matchQuery.classification = classification;

    if (stockStatus) {
        if (stockStatus === 'IN_STOCK') {
            matchQuery.inventoryLevel = { $gte: 1 };
        } else if (stockStatus === 'LOW_STOCK') {
            matchQuery.inventoryLevel = { $gt: 0, $lt: 10 };
        } else if (stockStatus === 'OUT_OF_STOCK') {
            matchQuery.inventoryLevel = { $lte: 0 };
        }
    }
    
    // Use unitPrice for filtering internally while supporting legacy price query
    if (minPrice !== undefined || maxPrice !== undefined) {
        matchQuery.unitPrice = {};
        if (minPrice !== undefined) matchQuery.unitPrice.$gte = Number(minPrice);
        if (maxPrice !== undefined) matchQuery.unitPrice.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { unitPrice: 1 };
    if (sort === 'price_desc') sortOption = { unitPrice: -1 };

    const results = await Product.aggregate([
        { $match: matchQuery },
        {
            $facet: {
                data: [
                    { $sort: sortOption },
                    { $skip: skip },
                    { $limit: limitNumber },
                    {
                        $project: {
                            _id: 0,
                            id: { 
                                $concat: [
                                    '#QB-', 
                                    { $toUpper: { $substrCP: [{ $toString: '$_id' }, 20, 4] } } 
                                ] 
                            },
                            internalId: "$_id",
                            product: {
                                name: '$name',
                                color: { $ifNull: ['$color', 'N/A'] },
                                thumbnail: { $ifNull: ['$imageUrl', ''] }
                            },
                            sku: 1,
                            classification: 1,
                            inventoryLevel: 1,
                            unitPrice: 1,
                            specs: { $ifNull: ['$specs', '$technicalSpecs', ''] }
                        }
                    }
                ],
                stats: [
                    {
                        $group: {
                            _id: null,
                            totalValue: { 
                                $sum: { 
                                    $multiply: ['$inventoryLevel', '$unitPrice'] 
                                } 
                            }
                        }
                    }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ]);

    const data = results[0].data;
    const stats = results[0].stats[0] || { totalValue: 0 };
    const totalProducts = results[0].totalCount[0] ? results[0].totalCount[0].count : 0;
    const systemLoad = mongoose.connection.readyState === 1 ? "Nominal" : "Degraded";

    res.status(200).json({
        success: true,
        page: pageNumber,
        limit: limitNumber,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limitNumber),
        stats: { 
            totalValue: stats.totalValue, 
            systemLoad 
        },
        data
    });
});

/**
 * @desc    Create new product with asset upload
 * @route   POST /api/admin/products
 */
const createProduct = asyncHandler(async (req, res) => {
    // Sanitize request body to remove empty objects (fixes Cast to String failed for {})
    const productData = { ...req.body };
    Object.keys(productData).forEach(key => {
        if (typeof productData[key] === 'object' && productData[key] !== null && !Array.isArray(productData[key]) && Object.keys(productData[key]).length === 0) {
            delete productData[key];
        }
    });

    // 1. Field Mapping (Canonicalization & Sync)
    if (productData.productName && !productData.name) productData.name = productData.productName;
    if (productData.productColor && !productData.color) productData.color = productData.productColor;
    if (productData.productSize && !productData.sizes) productData.sizes = [productData.productSize];
    if (productData.technicalSpecs && !productData.specs) productData.specs = productData.technicalSpecs;
    
    if (productData.price && !productData.unitPrice) productData.unitPrice = productData.price;
    if (productData.stock !== undefined && productData.inventoryLevel === undefined) productData.inventoryLevel = productData.stock;

    // Ensure numeric fields are actually numbers (important for multipart form data)
    if (productData.unitPrice) productData.unitPrice = Number(productData.unitPrice);
    if (productData.inventoryLevel) productData.inventoryLevel = Number(productData.inventoryLevel);

    // Sync legacy fields
    productData.price = productData.unitPrice;
    productData.stock = productData.inventoryLevel;
    productData.technicalSpecs = productData.specs;

    // Force rating to 0 for new products - should only be calculated from reviews
    productData.rating = 0;
    productData.numReviews = 0;

    // 2. SKU Logic
    if (!productData.sku || productData.sku.trim() === '') {
        let isUnique = false;
        while (!isUnique) {
            const newSku = generateSKU();
            const existing = await Product.findOne({ sku: newSku });
            if (!existing) {
                productData.sku = newSku;
                isUnique = true;
            }
        }
    } else {
        // Validate uniqueness if admin provided SKU
        const existing = await Product.findOne({ sku: productData.sku });
        if (existing) {
            return res.status(400).json({ success: false, message: 'SKU already exists' });
        }
    }

    const newProduct = new Product(productData);
    
    if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const uploadResult = await cloudinary.uploader.upload(dataURI, { folder: 'efoy_gebya/products' });
        newProduct.imageUrl = uploadResult.secure_url;
    } else if (productData.imageUrl) {
        newProduct.imageUrl = productData.imageUrl;
    }

    await newProduct.save();

    res.status(201).json({ 
        success: true, 
        message: 'Product created successfully',
        data: newProduct,
        product: newProduct // Alias for frontend
    });
});

/**
 * @desc    Update existing product with change logging
 * @route   PUT /api/admin/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid Product ID format" });
    }
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) return res.status(404).json({ success: false, message: "Product not found" });

    // Sanitize request body to remove empty objects (fixes Cast to String failed for {})
    const updateData = { ...req.body };
    Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'object' && updateData[key] !== null && !Array.isArray(updateData[key]) && Object.keys(updateData[key]).length === 0) {
            delete updateData[key];
        }
    });

    // Mapping for backward compatibility & Sync
    if (updateData.productName && !updateData.name) updateData.name = updateData.productName;
    if (updateData.productColor && !updateData.color) updateData.color = updateData.productColor;
    if (updateData.productSize && !updateData.sizes) updateData.sizes = [updateData.productSize];
    if (updateData.technicalSpecs && !updateData.specs) updateData.specs = updateData.technicalSpecs;

    if (updateData.price && !updateData.unitPrice) updateData.unitPrice = updateData.price;
    if (updateData.stock !== undefined && updateData.inventoryLevel === undefined) updateData.inventoryLevel = updateData.stock;

    // Ensure numerics
    if (updateData.unitPrice) updateData.unitPrice = Number(updateData.unitPrice);
    if (updateData.inventoryLevel) updateData.inventoryLevel = Number(updateData.inventoryLevel);

    // Sync legacy fields
    if (updateData.unitPrice !== undefined) updateData.price = updateData.unitPrice;
    if (updateData.inventoryLevel !== undefined) updateData.stock = updateData.inventoryLevel;
    if (updateData.specs !== undefined) updateData.technicalSpecs = updateData.specs;

    // Prevent manual updates to rating and reviews - these should be handled by the review system
    delete updateData.rating;
    delete updateData.numReviews;

    // SKU Modification check
    if (updateData.sku && updateData.sku !== oldProduct.sku) {
        const existing = await Product.findOne({ sku: updateData.sku, _id: { $ne: req.params.id } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'SKU already exists' });
        }
    }

    if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const uploadResult = await cloudinary.uploader.upload(dataURI, { folder: 'efoy_gebya/products' });
        updateData.imageUrl = uploadResult.secure_url;
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after', runValidators: true });

    // Background Logging
    if (updateData.unitPrice && oldProduct.unitPrice !== Number(updateData.unitPrice)) {
        logProductChange(updatedProduct._id, req.user._id, 'update_price', oldProduct.unitPrice, updateData.unitPrice);
    }
    if (updateData.inventoryLevel && oldProduct.inventoryLevel !== Number(updateData.inventoryLevel)) {
        logProductChange(updatedProduct._id, req.user._id, 'update_stock', oldProduct.inventoryLevel, updateData.inventoryLevel);
    }

    res.status(200).json({ 
        success: true, 
        message: 'Product updated successfully',
        data: updatedProduct,
        product: updatedProduct // Alias for frontend
    });
});

/**
 * @desc    Delete product
 * @route   DELETE /api/admin/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid Product ID format" });
    }
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product deleted" });
});

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
