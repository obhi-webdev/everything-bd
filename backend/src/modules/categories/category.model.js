import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 100
  },
  imageUrl: { type: String, default: "" },
  description: { type: String, default: "", maxlength: 500 },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Category =
  mongoose.models.Category ||
  mongoose.model("Category", categorySchema);
