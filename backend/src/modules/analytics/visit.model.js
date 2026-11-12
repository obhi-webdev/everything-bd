import mongoose from "mongoose";

const visitSchema = new mongoose.Schema({
  sessionHash: {
    type: String,
    required: true,
    maxlength: 64
  },
  path: {
    type: String,
    required: true,
    maxlength: 180
  },
  kind: {
    type: String,
    enum: ["home", "product", "landing"],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  versionKey: false
});

// Retain analytics for approximately 100 days.
// MongoDB TTL cleanup is asynchronous.
visitSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 100 * 86400 }
);

visitSchema.index({ createdAt: -1 });
visitSchema.index({ sessionHash: 1, createdAt: -1 });

export const StoreVisit =
  mongoose.models.StoreVisit ||
  mongoose.model("StoreVisit", visitSchema);
