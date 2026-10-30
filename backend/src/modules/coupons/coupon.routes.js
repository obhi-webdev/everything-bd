import rateLimit from "express-rate-limit";
import { Router } from "express";
import { Coupon } from "./coupon.model.js";
import {
  normalizeCode,
  calculateDiscount,
  getValidCoupon
} from "./coupon.logic.js";
import { requireAuth, requireRole } from "../../middlewares/requireAuth.js";

export const couponAdminRoutes = Router();
export const couponPublicRoutes = Router();

function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid coupon data");
  }

  const code = normalizeCode(body.code);
  const type = body.type;
  const value = Number(body.value);
  const minimumOrder = Number(body.minimumOrder || 0);
  const maximumDiscount = body.maximumDiscount === "" ||
    body.maximumDiscount == null ? null : Number(body.maximumDiscount);
  const usageLimit = body.usageLimit === "" ||
    body.usageLimit == null ? null : Number(body.usageLimit);

  const expiresAt = body.expiresAt
    ? new Date(body.expiresAt)
    : null;

  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    throw new Error("Coupon code must be 3-30 letters, numbers, _ or -");
  }
  if (!["percentage", "fixed"].includes(type)) {
    throw new Error("Invalid discount type");
  }
  if (!Number.isFinite(value) || value <= 0 ||
      (type === "percentage" && value > 100)) {
    throw new Error("Invalid discount value");
  }
  if (!Number.isFinite(minimumOrder) || minimumOrder < 0) {
    throw new Error("Invalid minimum order");
  }
  if (maximumDiscount !== null &&
      (!Number.isFinite(maximumDiscount) || maximumDiscount < 0)) {
    throw new Error("Invalid maximum discount");
  }
  if (usageLimit !== null &&
      (!Number.isSafeInteger(usageLimit) || usageLimit < 1)) {
    throw new Error("Invalid usage limit");
  }
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new Error("Invalid expiration date");
  }
  if (typeof body.isActive !== "boolean") {
    throw new Error("Invalid active status");
  }

  return {
    code, type, value, minimumOrder,
    maximumDiscount, usageLimit, expiresAt,
    isActive: body.isActive
  };
}

couponAdminRoutes.use(requireAuth, requireRole("admin"));

couponAdminRoutes.get("/", async (req, res) => {
  try {
    const data = await Coupon.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.set("Cache-Control", "no-store");
    res.json({ success: true, data });
  } catch {
    res.status(500).json({
      success: false, message: "Unable to load coupons"
    });
  }
});

couponAdminRoutes.post("/", async (req, res) => {
  try {
    const coupon = await Coupon.create(validate(req.body));
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message: error.code === 11000
        ? "Coupon code already exists" : error.message
    });
  }
});

couponAdminRoutes.put("/:id", async (req, res) => {
  try {
    const existing = await Coupon.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false, message: "Coupon not found"
      });
    }

    const data = validate(req.body);

    if (data.usageLimit != null &&
        data.usageLimit < existing.usedCount) {
      return res.status(400).json({
        success: false,
        message: "Usage limit cannot be below existing usage"
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message: error.code === 11000
        ? "Coupon code already exists" : error.message
    });
  }
});

couponAdminRoutes.delete("/:id", async (req, res) => {
  try {
    const existing = await Coupon.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false, message: "Coupon not found"
      });
    }
    if (existing.usedCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Used coupon cannot be deleted. Disable it instead."
      });
    }

    await existing.deleteOne();
    res.json({ success: true, message: "Coupon deleted" });
  } catch {
    res.status(400).json({
      success: false, message: "Unable to delete coupon"
    });
  }
});

const couponValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

couponPublicRoutes.post(
  "/validate",
  couponValidationLimiter,
  async (req, res) => {
  try {
    const code = normalizeCode(req.body?.code);
    const subtotal = Number(req.body?.subtotal);

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return res.status(400).json({
        success: false, message: "Invalid subtotal"
      });
    }

    const coupon = await getValidCoupon(code, subtotal);
    if (!coupon) {
      return res.status(400).json({
        success: false, message: "Enter a coupon code"
      });
    }

    // Preview only; final discount is recalculated from DB prices.
    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      data: {
        code: coupon.code,
        discount: calculateDiscount(coupon, subtotal)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false, message: error.message
    });
  }
});
