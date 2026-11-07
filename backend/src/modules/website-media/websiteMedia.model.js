import mongoose from "mongoose";

const websiteMediaSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 200
    },
    imageUrl: {
      type: String,
      required: true,
      maxlength: 1500
    },
    linkUrl: {
      type: String,
      default: "",
      maxlength: 500
    },
    altText: {
      type: String,
      default: "",
      maxlength: 180
    }
  },
  { timestamps: true }
);

export const WebsiteMedia =
  mongoose.models.WebsiteMedia ||
  mongoose.model("WebsiteMedia", websiteMediaSchema);
