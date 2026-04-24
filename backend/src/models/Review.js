const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: true // the controller will enforce this
    }
}, {
    timestamps: true
});

// A user can only leave one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to get avg rating and save
reviewSchema.statics.getAverageRating = async function (productId) {
    const obj = await this.aggregate([
        {
            $match: { product: productId }
        },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                numOfReviews: { $sum: 1 }
            }
        }
    ]);

    try {
        if (obj[0]) {
            await this.model('Product').findByIdAndUpdate(productId, {
                rating: obj[0].averageRating,
                numReviews: obj[0].numOfReviews
            });
        } else {
            await this.model('Product').findByIdAndUpdate(productId, {
                rating: 0,
                numReviews: 0
            });
        }
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after saving a review (Mongoose 8+ hook)
reviewSchema.post('save', async function () {
    await this.constructor.getAverageRating(this.product);
});

// Call getAverageRating after deleting a review
reviewSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await doc.constructor.getAverageRating(doc.product);
    }
});

module.exports = mongoose.model('Review', reviewSchema);
