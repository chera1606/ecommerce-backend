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
    const { search, classification, minPrice, maxPrice, sort, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    let matchQuery = {};
    if (search) matchQuery.name = { $regex: search, $options: 'i' };
    if (classification) matchQuery.classification = classification;
    
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
    const productData = { ...req.body };

    // 1. Field Mapping (Canonicalization & Sync)
    if (productData.price && !productData.unitPrice) productData.unitPrice = productData.price;
    if (productData.stock !== undefined && productData.inventoryLevel === undefined) productData.inventoryLevel = productData.stock;
    if (productData.technicalSpecs && !productData.specs) productData.specs = productData.technicalSpecs;

    // Ensure legacy fields are synced for DB persistence
    productData.price = productData.unitPrice;
    productData.stock = productData.inventoryLevel;
    productData.technicalSpecs = productData.specs;

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
    }

    await newProduct.save();

    // Clean response object
    const responseData = newProduct.toObject();
    delete responseData._id;
    delete responseData.__v;
    delete responseData.price;
    delete responseData.stock;
    delete responseData.technicalSpecs;

    res.status(201).json({ success: true, data: responseData });
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

    const updateData = { ...req.body };

    // Mapping for backward compatibility & Sync
    if (updateData.price && !updateData.unitPrice) updateData.unitPrice = updateData.price;
    if (updateData.stock !== undefined && updateData.inventoryLevel === undefined) updateData.inventoryLevel = updateData.stock;
    if (updateData.technicalSpecs && !updateData.specs) updateData.specs = updateData.technicalSpecs;

    // Ensure legacy fields are updated in DB
    if (updateData.unitPrice !== undefined) updateData.price = updateData.unitPrice;
    if (updateData.inventoryLevel !== undefined) updateData.stock = updateData.inventoryLevel;
    if (updateData.specs !== undefined) updateData.technicalSpecs = updateData.specs;

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

    // Clean response object
    const responseData = updatedProduct.toObject();
    delete responseData._id;
    delete responseData.__v;
    delete responseData.price;
    delete responseData.stock;
    delete responseData.technicalSpecs;

    res.status(200).json({ success: true, data: responseData });
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
