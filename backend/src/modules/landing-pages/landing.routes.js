import { Router } from "express";
import mongoose from "mongoose";
import { LandingPage } from "./landing.model.js";
import { requireAuth, requireRole } from "../../middlewares/requireAuth.js";

export const publicLandingRoutes = Router();
export const adminLandingRoutes = Router();

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function safeHttps(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid landing page data");
  }

  const name = String(body.name || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();
  const productId = String(body.productId || "").trim();
  const images = body.images;

  if (!name || name.length > 120) throw new Error("Invalid page name");
  if (!slugPattern.test(slug) || slug.length > 90) {
    throw new Error("Slug must contain lowercase letters, numbers and hyphens");
  }
  if (!mongoose.isValidObjectId(productId)) {
    throw new Error("A valid existing Product ID is required");
  }
  if (!Array.isArray(images) || images.length > 12 ||
      images.some(url => typeof url !== "string" || !safeHttps(url))) {
    throw new Error("Images must be HTTPS URLs (maximum 12)");
  }

  const videoUrl = String(body.videoUrl || "").trim();

  if (videoUrl && !safeHttps(videoUrl)) {
    throw new Error("Video must use an HTTPS URL");
  }

  const textFields = {
    headline: 200,
    description: 6000,
    benefits: 3000,
    buttonText: 50
  };

  const text = {};
  for (const [key, limit] of Object.entries(textFields)) {
    const value = body[key] ?? "";
    if (typeof value !== "string" || value.length > limit) {
      throw new Error(`Invalid ${key}`);
    }
    text[key] = value.trim();
  }

  return {
    name, slug, productId, images, videoUrl,
    ...text,
    isPublished: body.isPublished === true
  };
}

publicLandingRoutes.get("/:slug", async (req, res) => {
  try {
    const page = await LandingPage.findOne({
      slug: req.params.slug,
      isPublished: true
    }).lean();

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Landing page not found"
      });
    }

    res.set("Cache-Control", "no-store");
    res.set("X-Robots-Tag", "noindex, nofollow");

    return res.json({ success: true, data: page });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load landing page"
    });
  }
});

adminLandingRoutes.use(requireAuth, requireRole("admin"));

adminLandingRoutes.get("/", async (req, res) => {
  try {
    const pages = await LandingPage.find()
      .sort({ createdAt: -1 })
      .lean();

    res.set("Cache-Control", "no-store");
    res.json({ success: true, data: pages });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to load landing pages"
    });
  }
});

adminLandingRoutes.post("/", async (req, res) => {
  try {
    const data = validate(req.body);
    const page = await LandingPage.create(data);
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message: error.code === 11000 ? "URL slug already exists" : error.message
    });
  }
});

adminLandingRoutes.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid page ID"
      });
    }

    const data = validate(req.body);
    const page = await LandingPage.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found"
      });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message: error.code === 11000 ? "URL slug already exists" : error.message
    });
  }
});

adminLandingRoutes.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid page ID"
      });
    }

    const page = await LandingPage.findByIdAndDelete(req.params.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found"
      });
    }

    res.json({ success: true, message: "Page deleted" });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to delete page"
    });
  }
});
