import { Router } from "express";
import rateLimit from "express-rate-limit";

import { login, me } from "./auth.controller.js";
import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Try again later."
  }
});

router.post("/login", loginLimiter, login);

router.get(
  "/me",
  requireAuth,
  requireRole("admin", "manager"),
  me
);

export default router;
