const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sku: { 
        type: String, 
        unique: true, 
        required: [true, 'SKU is required'] 
    },
    classification: { 
        type: String, 
        enum: [
            'SHOES', 'ELECTRONICS', 'CLOTHING', 'ACCESSORIES', 
            'CHILDREN', 'HOME MATERIALS', 'BEAUTY',
            'FOOTWEAR', 'APPAREL' // Legacy support
        ] 
    },
    color: { type: String },
    inventoryLevel: { 
        type: Number, 
        min: 0, 
        required: [true, 'Inventory level is required'] 
    },
    unitPrice: { 
        type: Number, 
        min: 0, 
        required: [true, 'Unit price is required'] 
    },
    specs: { type: String }, // New canonical field for technical specs
    technicalSpecs: { type: String }, // Retained for backwards compatibility
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    
    // Legacy fields - made optional but kept for DB compatibility
    price: { type: Number }, 
    stock: { type: Number, default: 0 },

    // New Fields for Home Page & Details
    description: { type: String, trim: true },
    images: [{ type: String }],
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category',
        required: false // Optional for legacy products, but recommended
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    salesCount: { type: Number, default: 0 } // Useful for quick sorting
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Sync unitPrice/price and inventoryLevel/stock
productSchema.pre('save', function() {
    if (this.isModified('unitPrice')) this.price = this.unitPrice;
    else if (this.isModified('price')) this.unitPrice = this.price;

    if (this.isModified('inventoryLevel')) this.stock = this.inventoryLevel;
    else if (this.isModified('stock')) this.inventoryLevel = this.stock;
});

// Virtual for low stock alert
productSchema.virtual('isLowStock').get(function() {
    return this.inventoryLevel < 5;
});

productSchema.index({ name: 1 });
productSchema.index({ classification: 1 });

module.exports = mongoose.model('Product', productSchema);
