import { Order } from "./order.model.js";
import { Product } from "../products/product.model.js";

export async function getAdminAnalytics(req, res) {
  try {
    const [
      totalOrders,
      activeProducts,
      pendingOrders,
      customers,
      orderValueResult,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Order.countDocuments({ orderStatus: "pending" }),
      Order.distinct("customer.phone"),
      Order.aggregate([
        {
          $match: {
            orderStatus: {
              $nin: ["cancelled", "returned"]
            }
          }
        },
        {
          $group: {
            _id: null,
            value: { $sum: "$total" }
          }
        }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "orderNumber customer.name total orderStatus createdAt"
        )
        .lean()
    ]);

    return res.json({
      success: true,
      data: {
        totalOrderValue: orderValueResult[0]?.value || 0,
        totalOrders,
        activeProducts,
        pendingOrders,
        totalCustomers: customers.filter(Boolean).length,
        recentOrders
      }
    });
  } catch (error) {
    console.error("Admin analytics failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load analytics"
    });
  }
}
