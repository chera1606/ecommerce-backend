const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    totalAmount: { // New companion field for analytics and future-proofing
        type: Number
    },
    status: {
        type: String,
        enum: ["PENDING", "SHIPPED", "DELIVERED"],
        default: "PENDING"
    },
    priority: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for high-performance analytics
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ 'items.productId': 1 });

module.exports = mongoose.model('Order', orderSchema);
