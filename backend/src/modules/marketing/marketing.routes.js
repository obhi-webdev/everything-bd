import { Router } from "express";
import crypto from "node:crypto";
import { MarketingSettings } from "./marketing.model.js";
import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";

const router = Router();

const settingsKey = "meta-marketing";

function encryptionKey() {
  const hex = process.env.META_SETTINGS_ENCRYPTION_KEY || "";
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("Meta encryption key not configured");
  }
  return Buffer.from(hex, "hex");
}

function encryptToken(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm", encryptionKey(), iv
  );
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted]
    .map(part => part.toString("base64"))
    .join(".");
}

router.get("/public", async (req, res) => {
  try {
    const settings = await MarketingSettings.findOne({
      key: settingsKey
    }).lean();

    res.set("Cache-Control", "no-store");
    return res.json({
      success: true,
      data: {
        enabled: Boolean(settings?.enabled && settings?.pixelId),
        pixelId: settings?.enabled ? settings?.pixelId || "" : ""
      }
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Marketing configuration unavailable"
    });
  }
});

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/", async (req, res) => {
  try {
    const settings = await MarketingSettings.findOne({
      key: settingsKey
    }).lean();

    res.set("Cache-Control", "no-store");
    return res.json({
      success: true,
      data: {
        pixelId: settings?.pixelId || "",
        hasCapiToken: Boolean(settings?.encryptedToken),
        testEventCode: settings?.testEventCode || "",
        enabled: Boolean(settings?.enabled),
        testMode: Boolean(settings?.testMode)
      }
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Could not load marketing settings"
    });
  }
});

router.put("/", async (req, res) => {
  try {
    const body = req.body || {};
    const pixelId = String(body.pixelId ?? "").trim();
    const testEventCode = String(body.testEventCode ?? "").trim();
    const token = String(body.capiToken ?? "").trim();

    if (pixelId && !/^[0-9]{8,25}$/.test(pixelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Meta Pixel ID"
      });
    }

    if (
      testEventCode &&
      !/^[a-zA-Z0-9_-]{1,100}$/.test(testEventCode)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Test Event Code"
      });
    }

    if (token.length > 4096) {
      return res.status(400).json({
        success: false,
        message: "Access token too long"
      });
    }

    if (
      typeof body.enabled !== "boolean" ||
      typeof body.testMode !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Tracking switches must be boolean"
      });
    }

    if (body.enabled && !pixelId) {
      return res.status(400).json({
        success: false,
        message: "Pixel ID required to enable tracking"
      });
    }

    const update = {
      pixelId,
      testEventCode,
      enabled: body.enabled,
      testMode: body.testMode
    };

    if (token) {
      update.encryptedToken = encryptToken(token);
    }

    if (body.removeCapiToken === true) {
      update.encryptedToken = "";
    }

    const settings = await MarketingSettings.findOneAndUpdate(
      { key: settingsKey },
      { $set: update },
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    return res.json({
      success: true,
      message: "Meta Marketing Settings saved",
      data: {
        pixelId: settings.pixelId,
        hasCapiToken: Boolean(settings.encryptedToken),
        testEventCode: settings.testEventCode,
        enabled: settings.enabled,
        testMode: settings.testMode
      }
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to save marketing settings"
    });
  }
});

export default router;
