const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/150'
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for product count
categorySchema.virtual('productCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

module.exports = mongoose.model('Category', categorySchema);
