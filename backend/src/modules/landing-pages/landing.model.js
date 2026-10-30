import mongoose from "mongoose";

const landingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  headline: { type: String, trim: true, maxlength: 200, default: "" },
  description: { type: String, trim: true, maxlength: 6000, default: "" },
  benefits: { type: String, trim: true, maxlength: 3000, default: "" },
  images: { type: [String], default: [] },
  videoUrl: { type: String, default: "" },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  buttonText: { type: String, default: "Order Now", maxlength: 50 },
  isPublished: { type: Boolean, default: false },
  views: { type: Number, default: 0 }
}, { timestamps: true });

export const LandingPage =
  mongoose.models.LandingPage ||
  mongoose.model("LandingPage", landingSchema);
