const mongoose = require('mongoose');

const productLogSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['update_price', 'update_stock'],
        required: true
    },
    oldValue: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    newValue: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ProductLog', productLogSchema);
