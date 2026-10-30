import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, default: "" },
  publicId: { type: String, default: "" }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  brand: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  ingredients: [String],
  benefits: [String],
  images: [imageSchema],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  compareAtPrice: {
    type: Number,
    default: null,
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["draft", "active", "archived"],
    default: "draft"
  },
  seo: {
    title: String,
    description: String
  }
}, {
  timestamps: true
});

productSchema.index({
  status: 1,
  category: 1,
  createdAt: -1
});

export const Product = mongoose.model(
  "Product",
  productSchema
);
