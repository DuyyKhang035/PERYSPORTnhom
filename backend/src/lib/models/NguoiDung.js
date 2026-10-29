import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    dateOfBirth: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    addresses: [
      {
        fullName: { type: String, default: '' },
        phone: { type: String, default: '' },
        province: { type: String, default: '' },
        district: { type: String, default: '' },
        ward: { type: String, default: '' },
        detail: { type: String, default: '' },
        fullAddress: { type: String, default: '' },
        label: { type: String, default: 'Nhà riêng' }, // 'Nhà riêng' | 'Văn phòng'
        isDefault: { type: Boolean, default: false },
      },
    ],
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
