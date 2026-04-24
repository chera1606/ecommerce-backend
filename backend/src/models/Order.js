const mongoose = require('mongoose');

// ─── Order Item Sub-document ──────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    size:  { type: String, trim: true },
    color: { type: String, trim: true }
}, { _id: false });

// ─── Main Order Schema ────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
    trackingId: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    items: [orderItemSchema],

    // ── Shipping / Delivery Info (free-text — user types, no dropdowns) ──────
    shippingAddress: {
        contactName: { type: String, trim: true },   // Contact person's name
        phone:       { type: String, trim: true },   // Contact phone number
        country:     { type: String, trim: true },   // Free-text country field
        address:     { type: String, trim: true }    // Free-text street/city address
    },

    // ── Delivery Options ──────────────────────────────────────────────────────
    urgentDelivery:    { type: Boolean, default: false },
    urgentDeliveryFee: { type: Number,  default: 0 },

    // ── Payment ───────────────────────────────────────────────────────────────
    paymentMethod: {
        type: String,
        enum: ['TELEBIRR', 'CHAPA', 'CASH_ON_DELIVERY', 'PENDING'],
        default: 'PENDING'
    },
    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'UNPAID'
    },
    paymentReference: { type: String, trim: true },

    // ── Totals ────────────────────────────────────────────────────────────────
    subtotal:    { type: Number },  // sum of (price × qty) before fees
    totalPrice:  { type: Number, required: true }, // final amount charged
    totalAmount: { type: Number },  // analytics alias — kept in sync below

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    },
    priority: { type: Boolean, default: false }

}, { timestamps: true });

// ── Pre-save hook (Mongoose v9 async pattern — NO `next` callback) ────────────
// Keep totalAmount in sync with totalPrice for analytics backward-compat.
orderSchema.pre('save', async function () {
    this.totalAmount = this.totalPrice;
});

// ── Indexes ───────────────────────────────────────────────────────────────────
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ 'items.productId': 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
