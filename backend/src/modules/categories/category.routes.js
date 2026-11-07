import { Router } from "express";
import { Category } from "./category.model.js";
import { Product } from "../products/product.model.js";
import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";

export const publicCategoryRoutes = Router();
export const adminCategoryRoutes = Router();

function validImage(url) {
  if (!url) return true;
  if (typeof url !== "string" || url.length > 1500) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

async function categoryList(includeInactive = false) {
  const [saved, existing] = await Promise.all([
    Category.find().lean(),
    Product.distinct("category", { status: "active" })
  ]);

  const map = new Map();

  for (const name of existing) {
    if (typeof name === "string" && name.trim()) {
      map.set(name.trim().toLowerCase(), {
        name: name.trim(),
        imageUrl: "",
        description: "",
        sortOrder: 1000,
        isActive: true,
        isLegacy: true
      });
    }
  }

  for (const category of saved) {
    map.set(category.name.toLowerCase(), {
      ...category,
      isLegacy: false
    });
  }

  return [...map.values()]
    .filter(item => includeInactive || item.isActive)
    .sort((a, b) =>
      a.sortOrder - b.sortOrder ||
      a.name.localeCompare(b.name)
    );
}

publicCategoryRoutes.get("/", async (_req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      data: await categoryList()
    });
  } catch (error) {
    console.error("Public categories:", error);
    res.status(500).json({
      message: "Unable to load categories"
    });
  }
});

adminCategoryRoutes.use(
  requireAuth,
  requireRole("admin")
);

adminCategoryRoutes.get("/", async (_req, res) => {
  try {
    res.json({
      success: true,
      data: await categoryList(true)
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load categories"
    });
  }
});

adminCategoryRoutes.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();

    if (!name || name.length > 100) {
      return res.status(400).json({
        message: "Category name must be 1–100 characters"
      });
    }

    const imageUrl = req.body.imageUrl || "";
    if (!validImage(imageUrl)) {
      return res.status(400).json({
        message: "Invalid category image URL"
      });
    }

    const existing = await Category.findOne({
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
    });

    if (existing) {
      return res.status(409).json({
        message: "Category already exists. Use Edit."
      });
    }

    const category = await Category.create({
      name,
      imageUrl,
      description: req.body.description || "",
      sortOrder: Number(req.body.sortOrder) || 0,
      isActive: req.body.isActive !== false
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      message: error.code === 11000
        ? "Category already exists"
        : "Unable to create category"
    });
  }
});

adminCategoryRoutes.put("/:id", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const imageUrl = req.body.imageUrl || "";

    if (!name || name.length > 100 || !validImage(imageUrl)) {
      return res.status(400).json({
        message: "Invalid category name or image"
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    if (category.name !== name) {
      const assigned = await Product.countDocuments({
        category: category.name
      });

      if (assigned) {
        return res.status(409).json({
          message: "This category has products. Reassign those products before renaming."
        });
      }

      const duplicate = await Category.findOne({
        name: {
          $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i"
        },
        _id: { $ne: category._id }
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Category name already exists"
        });
      }
    }

    category.name = name;
    category.imageUrl = imageUrl;
    category.description = req.body.description || "";
    category.sortOrder = Number(req.body.sortOrder) || 0;
    category.isActive = req.body.isActive !== false;

    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      message: "Unable to update category"
    });
  }
});

adminCategoryRoutes.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: "Category not found"
      });
    }

    const assigned = await Product.countDocuments({
      category: category.name
    });

    if (assigned > 0) {
      return res.status(409).json({
        message: `Cannot delete: ${assigned} products use this category`
      });
    }

    await category.deleteOne();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete category"
    });
  }
});

adminCategoryRoutes.post("/import/:name", async (req, res) => {
  try {
    const name = String(req.params.name || "").trim();

    const exists = await Product.exists({ category: name });
    if (!exists) {
      return res.status(404).json({
        message: "Product category not found"
      });
    }

    const category = await Category.findOneAndUpdate(
      { name },
      {
        $setOnInsert: {
          name,
          imageUrl: "",
          description: "",
          sortOrder: 0,
          isActive: true
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({
      message: "Unable to import category"
    });
  }
});
