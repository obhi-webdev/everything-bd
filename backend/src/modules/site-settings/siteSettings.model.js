import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: {
    type: String,
    default: "global",
    unique: true,
    immutable: true
  },
  faviconUrl: {
    type: String,
    default: ""
  }
}, { timestamps: true });

export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", schema);
