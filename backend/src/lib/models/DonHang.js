import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  color: { type: String, required: true },
  size: { type: String, required: true },
  image: { type: String, default: '' },
  unitPrice: { type: Number, required: true },
  originalUnitPrice: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true },
  promotionName: { type: String, default: '' },
});

const OrderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
    },
    shippingAddress: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: '',
    },
    items: [OrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'BANK_TRANSFER', 'MOMO'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'ready_to_ship', 'shipping', 'delivered', 'completed', 'cancelled'],
      default: 'pending',
    },
    cancelReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    stockRestored: {
      type: Boolean,
      default: false,
    },
    soldCountUpdated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

OrderSchema.index({ customerPhone: 1 });
OrderSchema.index({ customerEmail: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
