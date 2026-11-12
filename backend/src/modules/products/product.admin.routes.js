import { Router } from "express";
import { validateProductCategory } from "./productCategoryGuard.js";

import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";

import {
  adminListProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminArchiveProduct
} from "./product.admin.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/", adminListProducts);
router.post("/", validateProductCategory, adminCreateProduct);
router.patch("/:id", validateProductCategory, adminUpdateProduct);
router.delete("/:id", adminArchiveProduct);

export default router;
