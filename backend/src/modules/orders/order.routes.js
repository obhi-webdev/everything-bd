import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createOrder } from "./order.controller.js";

const router = Router();
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

router.post("/", checkoutLimiter, createOrder);

export default router;
