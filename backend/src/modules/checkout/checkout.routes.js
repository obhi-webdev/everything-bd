const legacyDeliveryKeys = {
  DELIVERY_INSIDE_MYMENSINGH: "DELIVERY_INSIDE_DHAKA",
  DELIVERY_OUTSIDE_MYMENSINGH: "DELIVERY_OUTSIDE_DHAKA"
};

import { Router } from "express";

const router = Router();

function getRate(key) {
  const value = (process.env[key] ?? process.env[legacyDeliveryKeys[key]]);

  if (value === undefined || value.trim() === "") {
    return null;
  }

  const rate = Number(value);

  if (!Number.isFinite(rate) || rate < 0) {
    return null;
  }

  return rate;
}

router.get("/config", (req, res) => {
  const insideMymensingh = getRate("DELIVERY_INSIDE_MYMENSINGH");
  const outsideMymensingh = getRate("DELIVERY_OUTSIDE_MYMENSINGH");

  const configured =
    insideMymensingh !== null &&
    outsideMymensingh !== null;

  res.set("Cache-Control", "no-store");

  res.json({
    success: true,
    currency: "BDT",
    paymentMethods: ["cod"],
    delivery: {
      inside_mymensingh: insideMymensingh,
      outside_mymensingh: outsideMymensingh
    },
    checkoutAvailable: configured,
    message: configured
      ? "Delivery rates configured"
      : "Delivery rates pending configuration"
  });
});

export default router;
