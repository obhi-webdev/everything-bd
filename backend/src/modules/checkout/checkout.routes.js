import { Router } from "express";

const router = Router();

function getRate(key) {
  const value = process.env[key];

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
  const insideDhaka = getRate("DELIVERY_INSIDE_DHAKA");
  const outsideDhaka = getRate("DELIVERY_OUTSIDE_DHAKA");

  const configured =
    insideDhaka !== null &&
    outsideDhaka !== null;

  res.set("Cache-Control", "no-store");

  res.json({
    success: true,
    currency: "BDT",
    paymentMethods: ["cod"],
    delivery: {
      inside_dhaka: insideDhaka,
      outside_dhaka: outsideDhaka
    },
    checkoutAvailable: configured,
    message: configured
      ? "Delivery rates configured"
      : "Delivery rates pending configuration"
  });
});

export default router;
