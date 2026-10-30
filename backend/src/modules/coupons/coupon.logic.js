import { Coupon } from "./coupon.model.js";

export const roundMoney = n =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

export function calculateDiscount(coupon, subtotal) {
  if (!coupon) return 0;

  const discount = coupon.type === "percentage"
    ? subtotal * coupon.value / 100
    : coupon.value;

  const capped = coupon.maximumDiscount == null
    ? discount
    : Math.min(discount, coupon.maximumDiscount);

  return roundMoney(Math.max(0, Math.min(subtotal, capped)));
}

export async function getValidCoupon(code, subtotal, session) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const coupon = await Coupon.findOne({ code: normalized })
    .session(session || null);

  if (!coupon || !coupon.isActive) {
    throw new Error("Invalid or inactive coupon");
  }

  if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
    throw new Error("This coupon has expired");
  }

  if (coupon.usageLimit != null &&
      coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached");
  }

  if (subtotal < coupon.minimumOrder) {
    throw new Error(
      `Minimum order ৳${coupon.minimumOrder} required`
    );
  }

  return coupon;
}

export async function redeemCoupon(coupon, session) {
  if (!coupon) return;

  const conditions = {
    _id: coupon._id,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ],
    $expr: {
      $or: [
        { $eq: ["$usageLimit", null] },
        { $lt: ["$usedCount", "$usageLimit"] }
      ]
    }
  };

  const result = await Coupon.updateOne(
    conditions,
    { $inc: { usedCount: 1 } },
    { session }
  );

  if (result.modifiedCount !== 1) {
    throw new Error("Coupon is no longer available");
  }
}
