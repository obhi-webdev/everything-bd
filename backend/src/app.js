import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import {
  publicCategoryRoutes,
  adminCategoryRoutes
} from "./modules/categories/category.routes.js";
import {
  publicWebsiteMediaRoutes,
  adminWebsiteMediaRoutes
} from "./modules/website-media/websiteMedia.routes.js";
import {
  couponAdminRoutes,
  couponPublicRoutes
} from "./modules/coupons/coupon.routes.js";
import customerAdminRoutes from "./modules/customers/customer.admin.routes.js";
import {
  publicSiteSettings,
  adminSiteSettings
} from "./modules/site-settings/siteSettings.routes.js";
import {
  publicLandingRoutes,
  adminLandingRoutes
} from "./modules/landing-pages/landing.routes.js";
import {
  publicBannerRoutes,
  adminBannerRoutes
} from "./modules/banners/banner.routes.js";
import marketingRoutes from "./modules/marketing/marketing.routes.js";
import publicOrderRoutes from "./modules/orders/order.routes.js";
import adminOrderRoutes from "./modules/orders/order.admin.routes.js";
import checkoutRoutes from "./modules/checkout/checkout.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";
import adminProductRoutes from "./modules/products/product.admin.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

app.disable("x-powered-by");

// Hostinger reverse proxy support.
// Set TRUST_PROXY_HOPS to the verified proxy hop count.
// Do not use trust proxy: true.
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);

if (
  !Number.isInteger(proxyHops) ||
  proxyHops < 0 ||
  proxyHops > 5
) {
  throw new Error("Invalid TRUST_PROXY_HOPS configuration");
}

app.set("trust proxy", proxyHops);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const productionOrigins = [
      "https://everything-bd.com",
      "https://www.everything-bd.com"
    ];

    const isLocalDev =
      process.env.NODE_ENV !== "production" &&
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");

    if (!origin || productionOrigins.includes(origin) || isLocalDev) {
      return callback(null, true);
    }

    const error = new Error("CORS origin not allowed");
    error.status = 403;
    return callback(error);
  }
}));
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "EverythingBD API is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/banners", publicBannerRoutes);
app.use("/api/admin/banners", adminBannerRoutes);
app.use("/api/website-media", publicWebsiteMediaRoutes);
app.use("/api/admin/website-media", adminWebsiteMediaRoutes);

app.use("/api/landing-pages", publicLandingRoutes);
app.use("/api/admin/landing-pages", adminLandingRoutes);

app.use("/api/site-settings", publicSiteSettings);
app.use("/api/admin/site-settings", adminSiteSettings);

app.use("/api/coupons", couponPublicRoutes);
app.use("/api/admin/coupons", couponAdminRoutes);

app.use("/api/categories", publicCategoryRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/products", productRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/admin/products", adminProductRoutes);

app.use("/api/admin/media", mediaRoutes);

app.use("/api/checkout", checkoutRoutes);

app.use("/api/orders", publicOrderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/customers", customerAdminRoutes);
app.use("/api/marketing", marketingRoutes);

app.use("/api/analytics", analyticsRoutes);

app.use((error, req, res, next) => {
  if (
    error.status === 403 &&
    error.message === "CORS origin not allowed"
  ) {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed"
    });
  }

  next(error);
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

export default app;
