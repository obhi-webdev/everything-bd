import {
  getValidCoupon,
  calculateDiscount,
  redeemCoupon
} from "../coupons/coupon.logic.js";
import { sendMetaPurchase } from "../marketing/metaCapi.js";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { Product } from "../products/product.model.js";
import { Order } from "./order.model.js";
import { createOrderSchema } from "./order.validation.js";

const money = n => Math.round((n + Number.EPSILON) * 100) / 100;

class CheckoutError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function deliveryCharge(zone) {
  const key = zone === "inside_dhaka"
    ? "DELIVERY_INSIDE_DHAKA"
    : "DELIVERY_OUTSIDE_DHAKA";

  const raw = process.env[key];

  if (raw === undefined || raw.trim() === "") {
    return null;
  }

  const rate = Number(raw);

  return Number.isFinite(rate) && rate >= 0
    ? money(rate)
    : null;
}

export async function createOrder(req, res) {
  const validated = createOrderSchema.safeParse(req.body);

  if (!validated.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid checkout information",
      errors: validated.error.flatten()
    });
  }

  const input = validated.data;

  // Checkout stays closed until both rates are configured.
  const inside = deliveryCharge("inside_dhaka");
  const outside = deliveryCharge("outside_dhaka");

  if (inside === null || outside === null) {
    return res.status(503).json({
      success: false,
      message: "Checkout unavailable: delivery rates pending"
    });
  }

  const rate = deliveryCharge(
    input.shippingAddress.deliveryZone
  );

  const district = input.shippingAddress.district
    .trim().toLowerCase();

  if (
    input.shippingAddress.deliveryZone === "inside_dhaka" &&
    district !== "dhaka"
  ) {
    return res.status(400).json({
      success: false,
      message: "Inside Dhaka delivery requires Dhaka district"
    });
  }

  const itemKeys = input.items.map(item =>
    `${item.productId.toLowerCase()}::${item.size || ""}`
  );

  if (new Set(itemKeys).size !== itemKeys.length) {
    return res.status(400).json({
      success: false,
      message: "Duplicate product and size entries are not allowed"
    });
  }

  try {
    const existing = await Order.exists({
      requestId: input.requestId
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This checkout request was already submitted"
      });
    }

    let order;

    await mongoose.connection.transaction(async session => {
      const items = [];
      let subtotal = 0;

      for (const requested of input.items) {
        const requestedSize = requested.size || "";

        const stockFilter = {
          _id: requested.productId,
          status: "active",
          stock: { $gte: requested.quantity }
        };

        const stockUpdate = {
          $inc: {
            stock: -requested.quantity,
            __v: 1
          }
        };

        if (requestedSize) {
          stockFilter.hasSizeVariants = true;
          stockFilter.sizeVariants = {
            $elemMatch: {
              size: requestedSize,
              stock: { $gte: requested.quantity }
            }
          };

          stockUpdate.$inc["sizeVariants.$.stock"] =
            -requested.quantity;
        } else {
          stockFilter.hasSizeVariants = { $ne: true };
        }

        const product = await Product.findOneAndUpdate(
          stockFilter,
          stockUpdate,
          { returnDocument: "before", session }
        );

        if (!product) {
          throw new CheckoutError(
            409,
            "Product unavailable or insufficient stock"
          );
        }

        if (
          !Number.isFinite(product.price) ||
          product.price < 0
        ) {
          throw new CheckoutError(
            409,
            "Invalid product price"
          );
        }

        const itemTotal = money(
          product.price * requested.quantity
        );

        subtotal = money(subtotal + itemTotal);

        items.push({
          product: product._id,
          sku: product.sku,
          name: product.name,
          size: requestedSize,
          image: product.images?.[0]?.url || "",
          price: product.price,
          quantity: requested.quantity,
          subtotal: itemTotal
        });
      }

      let coupon = null;
      let discount = 0;

      if (input.couponCode) {
        try {
          coupon = await getValidCoupon(
            input.couponCode, subtotal, session
          );
          discount = calculateDiscount(coupon, subtotal);
        } catch (error) {
          throw new CheckoutError(400, error.message);
        }
      }

      const orderNumber =
        "EBD-" + crypto.randomUUID()
          .replaceAll("-", "")
          .slice(0, 16)
          .toUpperCase();

      const created = await Order.create([{
        requestId: input.requestId,
        orderNumber,
        customer: input.customer,
        shippingAddress: input.shippingAddress,
        items,
        subtotal,
        deliveryCharge: rate,
        couponCode: coupon?.code || "",
        discount,
        total: money(subtotal + rate - discount),
        paymentMethod: "cod",
        paymentStatus: "unpaid",
        orderStatus: "pending",
        customerNote: input.customerNote
      }], { session });

      if (coupon) {
        try {
          await redeemCoupon(coupon, session);
        } catch (error) {
          throw new CheckoutError(409, error.message);
        }
      }

      order = created[0];
    });

    res.set("Cache-Control", "no-store");

    // Never send real Meta events from the isolated size test DB.
    if (mongoose.connection.name !== "everythingbd_size_variation_test") {
      try {
        await sendMetaPurchase(order, req);
      } catch (metaError) {
        console.error(
          "Meta Purchase tracking failed:",
          metaError.message
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        orderNumber: order.orderNumber,
        total: order.total,
        orderStatus: order.orderStatus
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate checkout request"
      });
    }

    if (error instanceof CheckoutError) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    console.error("Order creation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Order could not be created"
    });
  }
}
