const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sku: { 
        type: String, 
        unique: true, 
        required: [true, 'SKU is required'] 
    },
    classification: { 
        type: String, 
        enum: ['FOOTWEAR', 'ELECTRONICS', 'APPAREL', 'ACCESSORIES'] 
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
    stock: { type: Number, default: 0 }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for low stock alert
productSchema.virtual('isLowStock').get(function() {
    return this.inventoryLevel < 5;
});

productSchema.index({ name: 1 });
productSchema.index({ classification: 1 });

module.exports = mongoose.model('Product', productSchema);
