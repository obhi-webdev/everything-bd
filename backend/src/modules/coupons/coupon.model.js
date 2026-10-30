import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: /^[A-Z0-9_-]{3,30}$/
  },
  type: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true
  },
  value: { type: Number, required: true, min: 0.01 },
  minimumOrder: { type: Number, default: 0, min: 0 },
  maximumDiscount: { type: Number, default: null, min: 0 },
  usageLimit: { type: Number, default: null, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Coupon =
  mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
