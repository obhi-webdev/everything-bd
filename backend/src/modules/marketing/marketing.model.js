import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  pixelId: { type: String, default: "" },
  encryptedToken: { type: String, default: "" },
  testEventCode: { type: String, default: "" },
  enabled: { type: Boolean, default: false },
  testMode: { type: Boolean, default: false }
}, { timestamps: true });

export const MarketingSettings = mongoose.model(
  "MarketingSettings", schema
);
