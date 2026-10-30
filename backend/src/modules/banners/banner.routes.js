import { Router } from "express";
import mongoose from "mongoose";
import { Banner } from "./banner.model.js";
import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";

export const publicBannerRoutes = Router();
export const adminBannerRoutes = Router();

const fields = [
  "title", "subtitle", "eyebrow", "buttonText",
  "buttonLink", "desktopImage", "mobileImage",
  "sortOrder", "isActive"
];

function validImage(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function validLink(value) {
  if (!value) return true;
  if (value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.includes("\\")) return true;

  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function normalize(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid banner data");
  }

  const data = {};

  for (const key of fields) {
    if (!(key in body)) continue;

    if (key === "sortOrder") {
      const number = Number(body[key]);
      if (!Number.isInteger(number) || number < 0 || number > 9999) {
        throw new Error("Display order must be between 0 and 9999");
      }
      data[key] = number;
    } else if (key === "isActive") {
      if (typeof body[key] !== "boolean") {
        throw new Error("Invalid active status");
      }
      data[key] = body[key];
    } else {
      if (typeof body[key] !== "string") {
        throw new Error(`Invalid ${key}`);
      }
      const limits = {
        title: 120, subtitle: 350, eyebrow: 70,
        buttonText: 50, buttonLink: 500,
        desktopImage: 1500, mobileImage: 1500
      };
      const value = body[key].trim();
      if (value.length > limits[key]) {
        throw new Error(`${key} is too long`);
      }
      data[key] = value;
    }
  }

  if (!partial && !data.desktopImage) {
    throw new Error("Desktop banner image is required");
  }
  if ("desktopImage" in data && !validImage(data.desktopImage)) {
    throw new Error("Desktop image must be a valid HTTPS URL");
  }
  if (data.mobileImage && !validImage(data.mobileImage)) {
    throw new Error("Mobile image must be a valid HTTPS URL");
  }
  if (!validLink(data.buttonLink)) {
    throw new Error("Invalid banner button link");
  }

  return data;
}

publicBannerRoutes.get("/", async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: banners });
  } catch (error) {
    console.error("Public banners error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load banners"
    });
  }
});

adminBannerRoutes.use(requireAuth, requireRole("admin"));

adminBannerRoutes.get("/", async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: banners });
  } catch (error) {
    console.error("Admin banners error:", error.message);
    res.status(500).json({ success: false, message: "Unable to load banners" });
  }
});

adminBannerRoutes.post("/", async (req, res) => {
  try {
    const data = normalize(req.body);
    const banner = await Banner.create(data);
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

adminBannerRoutes.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid banner ID" });
    }

    const data = normalize(req.body, true);
    if (!Object.keys(data).length) {
      return res.status(400).json({ success: false, message: "No changes provided" });
    }

    const banner = await Banner.findByIdAndUpdate(
      req.params.id, { $set: data },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

adminBannerRoutes.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid banner ID" });
    }

    const deleted = await Banner.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to delete banner" });
  }
});
