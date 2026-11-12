import { Order } from "./order.model.js";
import { Product } from "../products/product.model.js";

const allowedPeriods = [7, 30, 90];

const bdDayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function bdDay(date) {
  const parts = Object.fromEntries(
    bdDayFormatter.formatToParts(date)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export async function getAdminAnalytics(req, res) {
  const days = Number(req.query.days ?? 7);

  if (!allowedPeriods.includes(days)) {
    return res.status(400).json({
      success: false,
      message: "Days must be 7, 30 or 90"
    });
  }

  try {
    const start = new Date(Date.now() - days * 86400000);
    const dateFilter = { createdAt: { $gte: start } };
    const valueFilter = {
      ...dateFilter,
      orderStatus: { $nin: ["cancelled", "returned"] }
    };

    const [
      totalOrders,
      activeProducts,
      pendingOrders,
      customers,
      orderValueResult,
      recentOrders,
      dailyCounts
    ] = await Promise.all([
      Order.countDocuments(dateFilter),
      Product.countDocuments({ status: "active" }),
      Order.countDocuments({
        ...dateFilter,
        orderStatus: "pending"
      }),
      Order.distinct("customer.phone", dateFilter),
      Order.aggregate([
        { $match: valueFilter },
        {
          $group: {
            _id: null,
            value: { $sum: "$total" }
          }
        }
      ]),
      Order.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "orderNumber customer.name total orderStatus createdAt"
        )
        .lean(),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Dhaka"
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const counts = new Map(
      dailyCounts.map(item => [item._id, item.count])
    );

    const dailyOrders = Array.from(
      { length: days },
      (_, index) => {
        const date = new Date(
          Date.now() - (days - 1 - index) * 86400000
        );
        const day = bdDay(date);

        return {
          date: day,
          orders: counts.get(day) || 0
        };
      }
    );

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      data: {
        periodDays: days,
        totalOrderValue: orderValueResult[0]?.value || 0,
        totalOrders,
        activeProducts,
        pendingOrders,
        totalCustomers: customers.filter(Boolean).length,
        recentOrders,
        dailyOrders,
        trafficTrackingAvailable: false
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
