import { Category } from "../categories/category.model.js";
import { Product } from "./product.model.js";

export async function validateProductCategory(req, res, next) {
  try {
    const provided = Object.prototype.hasOwnProperty.call(
      req.body || {},
      "category"
    );

    // Product PATCH can update fields other than category.
    if (!provided && req.method === "PATCH") {
      return next();
    }

    const name = req.body?.category;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 120
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid product category."
      });
    }

    const normalized = name.trim();

    const category = await Category.findOne({
      name: normalized,
      isActive: true
    }).collation({
      locale: "en",
      strength: 2
    }).lean();

    if (category) {
      // Use the canonical category name saved by admin.
      req.body.category = category.name;
      return next();
    }

    // Preserve the ability to edit an older product
    // without changing its legacy category.
    if (req.method === "PATCH" && req.params.id) {
      const product = await Product.findById(
        req.params.id
      ).select("category").lean();

      if (
        product &&
        typeof product.category === "string" &&
        product.category === normalized
      ) {
        return next();
      }
    }

    return res.status(400).json({
      success: false,
      message:
        "Category not found or inactive. " +
        "Create and activate it in Category Management first."
    });

  } catch (error) {
    return next(error);
  }
}
