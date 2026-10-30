import { Router } from "express";

import {
  getProducts,
  getProduct
} from "./product.controller.js";

const router = Router();

router.get("/", getProducts);
router.get("/:slug", getProduct);

export default router;
