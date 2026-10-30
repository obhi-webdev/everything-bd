import mongoose from "mongoose";
import { Product } from "./product.model.js";
import {
  productSchema,
  updateProductSchema
} from "./product.validation.js";

function sendError(res, error) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Product SKU or slug already exists"
    });
  }

  console.error("Product API error:", error.message);

  return res.status(500).json({
    success: false,
    message: "Product operation failed"
  });
}

function validateId(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID"
    });
    return false;
  }
  return true;
}

export async function adminListProducts(req, res) {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function adminCreateProduct(req, res) {
  const parsed = productSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid product information",
      errors: parsed.error.flatten()
    });
  }

  try {
    const product = await Product.create(parsed.data);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function adminUpdateProduct(req, res) {
  if (!validateId(req, res)) return;

  const parsed = updateProductSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid product information",
      errors: parsed.error.flatten()
    });
  }

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const nextPrice = parsed.data.price ?? product.price;
    const nextCompare = Object.hasOwn(
      parsed.data, "compareAtPrice"
    )
      ? parsed.data.compareAtPrice
      : product.compareAtPrice;

    if (
      nextCompare != null &&
      nextCompare < nextPrice
    ) {
      return res.status(400).json({
        success: false,
        message: "Compare price cannot be below selling price"
      });
    }

    Object.assign(product, parsed.data);
    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Product validation failed"
      });
    }
    sendError(res, error);
  }
}

export async function adminArchiveProduct(req, res) {
  if (!validateId(req, res)) return;

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "archived" } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product archived successfully",
      data: product
    });
  } catch (error) {
    sendError(res, error);
  }
}
