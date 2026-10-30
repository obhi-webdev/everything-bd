import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 120, default: "" },
    subtitle: { type: String, trim: true, maxlength: 350, default: "" },
    eyebrow: { type: String, trim: true, maxlength: 70, default: "" },
    buttonText: { type: String, trim: true, maxlength: 50, default: "" },
    buttonLink: { type: String, trim: true, maxlength: 500, default: "" },
    desktopImage: { type: String, required: true },
    mobileImage: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Banner =
  mongoose.models.Banner || mongoose.model("Banner", bannerSchema);
