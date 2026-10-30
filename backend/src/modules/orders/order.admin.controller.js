import mongoose from "mongoose";
import { Order } from "./order.model.js";

const allowedStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned"
];

export async function listAdminOrders(req, res, next) {
  try {
    const page = Math.max(
      1,
      Math.min(100000, Math.trunc(Number(req.query.page) || 1))
    );

    const limit = Math.max(
      1,
      Math.min(50, Math.trunc(Number(req.query.limit) || 15))
    );

    const filter = {};

    if (req.query.status) {
      if (
        typeof req.query.status !== "string" ||
        !allowedStatuses.includes(req.query.status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status"
        });
      }

      filter.orderStatus = req.query.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Order.countDocuments(filter)
    ]);

    res.set("Cache-Control", "no-store");

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminOrder(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(
      req.params.id
    ).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.set("Cache-Control", "no-store");

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
}


const allowedTransitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  returned: []
};

export async function updateAdminOrderStatus(req, res, next) {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID"
    });
  }

  if (typeof status !== "string" ||
      !["confirmed", "processing", "shipped",
        "delivered", "cancelled"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid target status"
    });
  }

  try {
    let updatedOrder;

    await mongoose.connection.transaction(async session => {
      const order = await Order.findById(id).session(session);

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      if (!allowedTransitions[order.orderStatus]?.includes(status)) {
        const error = new Error(
          `Cannot change ${order.orderStatus} to ${status}`
        );
        error.statusCode = 409;
        throw error;
      }

      // Conditional update prevents two admins from both
      // successfully changing the same original status.
      const changes = { orderStatus: status };

      if (status === "confirmed") {
        changes.confirmedAt = new Date();
      }

      if (status === "shipped") {
        changes.shippedAt = new Date();
      }

      if (status === "delivered") {
        changes.deliveredAt = new Date();
      }

      updatedOrder = await Order.findOneAndUpdate(
        { _id: id, orderStatus: order.orderStatus },
        { $set: changes },
        { returnDocument: "after", session, runValidators: true }
      );

      if (!updatedOrder) {
        const error = new Error("Order changed. Refresh and retry.");
        error.statusCode = 409;
        throw error;
      }

      if (status === "cancelled") {
        const Product = mongoose.model("Product");

        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      }
    });

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      message: "Order status updated",
      data: updatedOrder
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
}
