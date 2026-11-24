import { StoreVisit } from "./visit.model.js";
import { Product } from "../products/product.model.js";
import { Order } from "../orders/order.model.js";

const allowedPeriods = new Set([1, 7, 30, 90]);
const DAY = 86400000;
const DHAKA_OFFSET = 6 * 3600000;

function getPeriod(days) {
  const now = new Date();

  const localToday = new Date(
    now.getTime() + DHAKA_OFFSET
  );

  localToday.setUTCHours(0, 0, 0, 0);

  const start = new Date(
    localToday.getTime() -
    DHAKA_OFFSET -
    (days - 1) * DAY
  );

  return { start, now };
}

function dateKey(date) {
  return new Date(
    date.getTime() + DHAKA_OFFSET
  ).toISOString().slice(0, 10);
}

export async function getProductAnalytics(req, res) {
  res.set("Cache-Control", "no-store");

  const days = Number(req.query.days ?? 7);

  if (!allowedPeriods.has(days)) {
    return res.status(400).json({
      success: false,
      message: "Days must be 1, 7, 30 or 90"
    });
  }

  try {
    const { start, now } = getPeriod(days);

    const dateFilter = {
      createdAt: {
        $gte: start,
        $lte: now
      }
    };

    const orderFilter = {
      ...dateFilter,
      archivedAt: null,
      orderStatus: {
        $nin: ["cancelled", "returned"]
      }
    };

    const [
      viewRows,
      orderRows,
      revenueRows,
      paidRows
    ] = await Promise.all([

      StoreVisit.aggregate([
        {
          $match: {
            ...dateFilter,
            kind: "product"
          }
        },
        {
          $group: {
            _id: "$path",
            views: { $sum: 1 }
          }
        },
        {
          $sort: {
            views: -1,
            _id: 1
          }
        }
      ]),

      Order.aggregate([
        { $match: orderFilter },
        { $unwind: "$items" },

        {
          $group: {
            _id: {
              product: "$items.product",
              order: "$_id"
            },
            quantity: {
              $sum: "$items.quantity"
            }
          }
        },

        {
          $group: {
            _id: "$_id.product",
            orders: { $sum: 1 },
            unitsOrdered: {
              $sum: "$quantity"
            }
          }
        }
      ]),

      Order.aggregate([
        { $match: orderFilter },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Dhaka"
              }
            },
            orders: { $sum: 1 },
            orderValue: {
              $sum: "$total"
            }
          }
        },

        { $sort: { _id: 1 } }
      ]),

      Order.aggregate([
        {
          $match: {
            ...orderFilter,
            paymentStatus: "paid"
          }
        },
        {
          $group: {
            _id: null,
            value: { $sum: "$total" }
          }
        }
      ])
    ]);

    const viewsBySlug = new Map();

    for (const row of viewRows) {
      const slug = String(row._id || "")
        .replace(/^\/product\//i, "")
        .toLowerCase();

      if (!slug) continue;

      viewsBySlug.set(
        slug,
        (viewsBySlug.get(slug) || 0) + row.views
      );
    }

    const ordersByProduct = new Map(
      orderRows.map(row => [
        String(row._id),
        row
      ])
    );

    const products = await Product.find({
      $or: [
        {
          slug: {
            $in: [...viewsBySlug.keys()]
          }
        },
        {
          _id: {
            $in: orderRows.map(row => row._id)
          }
        }
      ]
    })
      .select("_id name slug images category")
      .lean();

    const ranked = products.map(product => {
      const views =
        viewsBySlug.get(product.slug) || 0;

      const orderData = ordersByProduct.get(
        String(product._id)
      );

      const orders = orderData?.orders || 0;

      return {
        productId: String(product._id),
        name: product.name,
        slug: product.slug,
        category: product.category,
        image: product.images?.[0]?.url || "",
        views,
        orders,
        unitsOrdered:
          orderData?.unitsOrdered || 0,
        conversionRate: views > 0
          ? Number(
              ((orders / views) * 100).toFixed(2)
            )
          : null
      };
    });

    ranked.sort((a, b) =>
      b.views - a.views ||
      b.orders - a.orders ||
      a.name.localeCompare(b.name)
    );

    const topProducts = ranked
      .filter(product => product.views > 0)
      .slice(0, 20)
      .map((product, index) => ({
        rank: index + 1,
        ...product
      }));

    const revenueByDate = new Map(
      revenueRows.map(row => [
        row._id,
        row
      ])
    );

    const dailyRevenue = Array.from(
      { length: days },
      (_, index) => {
        const date = dateKey(
          new Date(
            start.getTime() + index * DAY
          )
        );

        const row = revenueByDate.get(date);

        return {
          date,
          orders: row?.orders || 0,
          orderValue: row?.orderValue || 0
        };
      }
    );

    const totalOrderValue = revenueRows.reduce(
      (sum, row) => sum + row.orderValue,
      0
    );

    const totalOrders = revenueRows.reduce(
      (sum, row) => sum + row.orders,
      0
    );

    const totalProductViews = viewRows.reduce(
      (sum, row) => sum + row.views,
      0
    );

    const matchedProductViews = ranked.reduce(
      (sum, product) => sum + product.views,
      0
    );

    return res.json({
      success: true,
      data: {
        days,
        timezone: "Asia/Dhaka",
        periodStart: start.toISOString(),
        periodEnd: now.toISOString(),

        totalOrderValue,
        totalOrders,
        paidOrderValue: paidRows[0]?.value || 0,

        totalProductViews,
        unmatchedProductViews:
          totalProductViews - matchedProductViews,

        dailyRevenue,
        topProducts,

        definitions: {
          views: "Recorded product page views",
          orders: "Distinct non-cancelled, non-returned, non-archived orders containing the product",
          conversionRate: "Product orders divided by recorded product views, multiplied by 100",
          revenue: "Order value including delivery and discounts, not cash collected",
          paidOrderValue: "Value of orders created in the period currently marked paid"
        }
      }
    });

  } catch (error) {
    console.error(
      "Product analytics failed:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load product analytics"
    });
  }
}
