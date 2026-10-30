import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is missing");
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("EverythingBD MongoDB Connected");
    return true;
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    return false;
  }
}
