import { Router } from "express";
import { WebsiteMedia } from "./websiteMedia.model.js";
import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";

export const publicWebsiteMediaRoutes = Router();
export const adminWebsiteMediaRoutes = Router();

const fixedSlots = new Set([
  "hero-side",
  "promo-1",
  "promo-2",
  "promo-3",
  "campaign-main"
]);

function validKey(key) {
  return typeof key === "string" &&
    (
      fixedSlots.has(key) ||
      (
        key.startsWith("category:") &&
        key.slice(9).trim().length > 0 &&
        key.slice(9).length <= 120
      )
    );
}

function validImage(url) {
  if (typeof url !== "string" || url.length > 1500) {
    return false;
  }

  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function validLink(value) {
  if (!value) return true;

  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return true;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

publicWebsiteMediaRoutes.get("/", async (_req, res) => {
  try {
    const data = await WebsiteMedia.find()
      .select("key imageUrl linkUrl altText")
      .lean();

    res.set("Cache-Control", "no-store");
    res.json({ success: true, data });
  } catch (error) {
    console.error("Website media load:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load website media"
    });
  }
});

adminWebsiteMediaRoutes.use(
  requireAuth,
  requireRole("admin")
);

adminWebsiteMediaRoutes.get("/", async (_req, res) => {
  try {
    const data = await WebsiteMedia.find()
      .sort({ key: 1 })
      .lean();

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load website media"
    });
  }
});

adminWebsiteMediaRoutes.put("/", async (req, res) => {
  try {
    const { key, imageUrl, linkUrl = "", altText = "" } =
      req.body || {};

    if (!validKey(key)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media slot"
      });
    }

    if (!validImage(imageUrl)) {
      return res.status(400).json({
        success: false,
        message: "A valid HTTPS image is required"
      });
    }

    if (
      typeof linkUrl !== "string" ||
      linkUrl.length > 500 ||
      !validLink(linkUrl)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner link"
      });
    }

    if (
      typeof altText !== "string" ||
      altText.length > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid image description"
      });
    }

    const data = await WebsiteMedia.findOneAndUpdate(
      { key },
      {
        $set: {
          imageUrl: imageUrl.trim(),
          linkUrl: linkUrl.trim(),
          altText: altText.trim()
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error("Website media save:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to save website media"
    });
  }
});

adminWebsiteMediaRoutes.delete("/", async (req, res) => {
  try {
    const key = req.query.key;

    if (!validKey(key)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media slot"
      });
    }

    await WebsiteMedia.deleteOne({ key });

    res.json({
      success: true,
      message: "Media slot cleared"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to remove website media"
    });
  }
});
