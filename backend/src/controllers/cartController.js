const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user's cart
// @route   GET /api/cart
const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ userId: req.user._id })
        .populate('items.productId', 'name price imageUrl images stock inventoryLevel');

    if (!cart) {
        return res.status(200).json({ success: true, data: { items: [], totalPrice: 0 } });
    }

    res.status(200).json({ success: true, data: cart });
});

// @desc    Add item to cart (or update quantity if exists)
// @route   POST /api/cart
const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity = 1, size, color } = req.body;

    if (!productId) {
        return res.status(400).json({ success: false, message: 'productId is required' });
    }

    // Validate product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const availableStock = product.inventoryLevel || product.stock || 0;
    if (availableStock < quantity) {
        return res.status(400).json({ success: false, message: `Only ${availableStock} items in stock` });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
        cart = new Cart({ userId: req.user._id, items: [] });
    }

    // Check if same product+size+color combo already in cart
    const existingIndex = cart.items.findIndex(
        item => item.productId.toString() === productId &&
                (item.size || '') === (size || '') &&
                (item.color || '') === (color || '')
    );

    if (existingIndex > -1) {
        // Update quantity
        cart.items[existingIndex].quantity += quantity;
    } else {
        // Add new item
        cart.items.push({
            productId,
            quantity,
            size: size || null,
            color: color || null,
            price: product.price || product.unitPrice
        });
    }

    await cart.save();
    await cart.populate('items.productId', 'name price imageUrl images stock inventoryLevel');

    res.status(200).json({ success: true, message: 'Item added to cart', data: cart });
});

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:itemId
const updateCartItem = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found in cart' });

    // Stock check
    const product = await Product.findById(item.productId);
    const availableStock = product ? (product.inventoryLevel || product.stock || 0) : 0;
    if (availableStock < quantity) {
        return res.status(400).json({ success: false, message: `Only ${availableStock} items in stock` });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.productId', 'name price imageUrl images stock inventoryLevel');

    res.status(200).json({ success: true, message: 'Cart updated', data: cart });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
const removeCartItem = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    await cart.save();

    res.status(200).json({ success: true, message: 'Item removed from cart', data: cart });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(200).json({ success: true, message: 'Cart already empty' });

    cart.items = [];
    await cart.save();

    res.status(200).json({ success: true, message: 'Cart cleared' });
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
