import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  colorCode: { type: String, default: '#000000' },
  size: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
});

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    description: {
      type: String,
      default: '',
    },
    images: [{ type: String }],
    variants: [VariantSchema],
    originalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
    },
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion',
      default: null,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ brand: 1, isActive: 1 });
ProductSchema.index({ soldCount: -1 });
ProductSchema.index({ 'variants.sku': 1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
