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

    const filter = {
      archivedAt: req.query.trash === "1"
        ? { $ne: null }
        : null
    };

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
          const size = String(item.size || "").trim();
          const quantity = Number(item.quantity);

          if (!Number.isInteger(quantity) || quantity < 1) {
            const error = new Error("Invalid order item quantity");
            error.statusCode = 409;
            throw error;
          }

          const filter = { _id: item.product };
          const increments = {
            stock: quantity,
            __v: 1
          };

          if (size) {
            filter.hasSizeVariants = true;
            filter.sizeVariants = {
              $elemMatch: { size }
            };
            increments["sizeVariants.$.stock"] = quantity;
          } else {
            filter.hasSizeVariants = { $ne: true };
          }

          const result = await Product.updateOne(
            filter,
            { $inc: increments },
            { session }
          );

          if (result.matchedCount !== 1) {
            const error = new Error(
              size
                ? `Cannot restore size ${size}: product or size missing`
                : "Cannot restore stock: product missing or changed"
            );
            error.statusCode = 409;
            throw error;
          }
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


// Archive only completed or already cancelled orders.
// The order is retained for accounting and audit purposes.
export async function archiveAdminOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { orderNumber } = req.body || {};

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.archivedAt) {
      return res.status(409).json({
        success: false,
        message: "Order is already in Trash"
      });
    }

    if (
      typeof orderNumber !== "string" ||
      orderNumber !== order.orderNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Order number confirmation does not match"
      });
    }

    if (!["cancelled", "returned", "delivered"].includes(
      order.orderStatus
    )) {
      return res.status(409).json({
        success: false,
        message:
          "Complete delivery/return or cancel the order " +
          "before moving it to Trash"
      });
    }

    const updated = await Order.findOneAndUpdate(
      {
        _id: id,
        archivedAt: null,
        orderStatus: order.orderStatus
      },
      { $set: { archivedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "Order changed. Refresh and retry."
      });
    }

    res.set("Cache-Control", "no-store");
    return res.json({
      success: true,
      message: "Order moved to Trash",
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreAdminOrder(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const restored = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        archivedAt: { $ne: null }
      },
      { $set: { archivedAt: null } },
      { new: true, runValidators: true }
    );

    if (!restored) {
      return res.status(404).json({
        success: false,
        message: "Order not found in Trash"
      });
    }

    res.set("Cache-Control", "no-store");
    return res.json({
      success: true,
      message: "Order restored",
      data: restored
    });
  } catch (error) {
    next(error);
  }
}
