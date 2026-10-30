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

app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173"
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

app.use("/api/products", productRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/admin/products", adminProductRoutes);

app.use("/api/admin/media", mediaRoutes);

app.use("/api/checkout", checkoutRoutes);

app.use("/api/orders", publicOrderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/marketing", marketingRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

export default app;
