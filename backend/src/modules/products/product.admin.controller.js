import mongoose from "mongoose";
import { validateProductInventory } from "./product.inventory.js";
import { Product } from "./product.model.js";
import { Order } from "../orders/order.model.js";
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

  const inventoryError = validateProductInventory(parsed.data);

  if (inventoryError) {
    return res.status(400).json({
      success: false,
      message: inventoryError
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

  const versionHeader = req.get("If-Match");

  if (!/^(0|[1-9][0-9]*)$/.test(versionHeader || "") ||
      !Number.isSafeInteger(Number(versionHeader))) {
    return res.status(428).json({
      success: false,
      message: "Product version required. Refresh and try again."
    });
  }

  const expectedVersion = Number(versionHeader);

  // Do not apply defaults for fields omitted from PATCH.
  const patch = Object.fromEntries(
    Object.entries(parsed.data).filter(([key]) =>
      Object.prototype.hasOwnProperty.call(req.body, key)
    )
  );

  const reject = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  };

  try {
    const updated = await mongoose.connection.transaction(
      async session => {
        const product = await Product.findById(req.params.id)
          .session(session);

        if (!product) {
          throw reject(404, "Product not found");
        }

        if (product.__v !== expectedVersion) {
          throw reject(
            409,
            "Product changed. Refresh and edit again."
          );
        }

        const nextPrice = patch.price ?? product.price;
        const nextCompare = Object.hasOwn(
          patch, "compareAtPrice"
        )
          ? patch.compareAtPrice
          : product.compareAtPrice;

        if (nextCompare != null &&
            nextCompare < nextPrice) {
          throw reject(
            400,
            "Compare price cannot be below selling price"
          );
        }

        const nextProduct = {
          ...product.toObject(),
          ...patch
        };

        const inventoryError =
          validateProductInventory(nextProduct);

        if (inventoryError) {
          throw reject(400, inventoryError);
        }

        const nextMode = Object.hasOwn(
          patch, "hasSizeVariants"
        )
          ? patch.hasSizeVariants
          : product.hasSizeVariants;

        const currentLabels = (product.sizeVariants || [])
          .map(v => String(v.size).trim().toUpperCase())
          .sort();

        const nextLabels = Object.hasOwn(
          patch, "sizeVariants"
        )
          ? patch.sizeVariants
              .map(v => String(v.size).trim().toUpperCase())
              .sort()
          : currentLabels;

        const configurationChanged =
          Boolean(nextMode) !== Boolean(product.hasSizeVariants) ||
          JSON.stringify(currentLabels) !== JSON.stringify(nextLabels);

        if (configurationChanged) {
          const existingOrder = await Order.exists({
            "items.product": product._id
          }).session(session);

          if (existingOrder) {
            throw reject(
              409,
              "Product has order history. Size mode and labels cannot change."
            );
          }
        }

        const result = await Product.findOneAndUpdate(
          {
            _id: product._id,
            __v: expectedVersion
          },
          {
            $set: patch,
            $inc: { __v: 1 }
          },
          {
            returnDocument: "after",
            runValidators: true,
            session
          }
        );

        if (!result) {
          throw reject(
            409,
            "Product changed. Refresh and retry."
          );
        }

        return result;
      }
    );

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      message: "Product updated successfully",
      data: updated
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Product validation failed"
      });
    }

    if (
      error.hasErrorLabel?.("TransientTransactionError") ||
      error.code === 112
    ) {
      return res.status(409).json({
        success: false,
        message: "Product changed concurrently. Refresh and retry."
      });
    }

    return sendError(res, error);
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
