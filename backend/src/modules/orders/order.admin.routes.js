import { Router } from "express";

import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";

import {
  listAdminOrders,
  getAdminOrder,
  updateAdminOrderStatus
} from "./order.admin.controller.js";

import { getAdminAnalytics } from "./order.analytics.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/analytics", getAdminAnalytics);
router.get("/", listAdminOrders);
router.patch("/:id/status", updateAdminOrderStatus);
router.get("/:id", getAdminOrder);

export default router;
