const mongoose = require('mongoose');

const productViewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    sessionId: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for fast lookup of last viewed products
productViewSchema.index({ userId: 1, viewedAt: -1 });
productViewSchema.index({ sessionId: 1, viewedAt: -1 });

module.exports = mongoose.model('ProductView', productViewSchema);
