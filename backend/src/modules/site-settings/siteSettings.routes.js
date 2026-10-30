import { Router } from "express";
import { SiteSettings } from "./siteSettings.model.js";
import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";

export const publicSiteSettings = Router();
export const adminSiteSettings = Router();

publicSiteSettings.get("/", async (req, res) => {
  try {
    const settings = await SiteSettings.findOne({
      key: "global"
    }).lean();

    res.set("Cache-Control", "no-store");

    res.json({
      success: true,
      data: {
        faviconUrl: settings?.faviconUrl || ""
      }
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to load website settings"
    });
  }
});

adminSiteSettings.use(requireAuth, requireRole("admin"));

adminSiteSettings.put("/", async (req, res) => {
  try {
    const faviconUrl = req.body?.faviconUrl;

    if (typeof faviconUrl !== "string" ||
        faviconUrl.length > 1500) {
      return res.status(400).json({
        success: false,
        message: "Invalid favicon URL"
      });
    }

    if (faviconUrl) {
      let url;

      try {
        url = new URL(faviconUrl);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid image URL"
        });
      }

      if (url.protocol !== "https:") {
        return res.status(400).json({
          success: false,
          message: "Favicon must use HTTPS"
        });
      }
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { key: "global" },
      { $set: { faviconUrl } },
      { new: true, upsert: true, runValidators: true }
    );

    res.set("Cache-Control", "no-store");

    res.json({
      success: true,
      data: { faviconUrl: settings.faviconUrl }
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to save favicon"
    });
  }
});
