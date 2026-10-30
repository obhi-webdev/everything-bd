import { Router } from "express";
import { Order } from "../orders/order.model.js";
import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";

const router = Router();

router.use(requireAuth, requireRole("admin", "manager"));

const normalizePhone = phone => {
  let value = String(phone || "").replace(/[^\d]/g, "");
  if (value.startsWith("880")) value = value.slice(2);
  return value;
};

const phoneExpression = {
  $let: {
    vars: {
      digits: {
        $reduce: {
          input: { $range: [0, { $strLenCP: "$customer.phone" }] },
          initialValue: "",
          in: {
            $let: {
              vars: {
                char: {
                  $substrCP: ["$customer.phone", "$$this", 1]
                }
              },
              in: {
                $cond: [
                  { $regexMatch: { input: "$$char", regex: /^[0-9]$/ } },
                  { $concat: ["$$value", "$$char"] },
                  "$$value"
                ]
              }
            }
          }
        }
      }
    },
    in: {
      $cond: [
        { $regexMatch: { input: "$$digits", regex: /^880/ } },
        { $substrCP: ["$$digits", 2, { $subtract: [{ $strLenCP: "$$digits" }, 2] }] },
        "$$digits"
      ]
    }
  }
};

const groupedCustomers = [
  {
    $addFields: {
      normalizedPhone: phoneExpression
    }
  },
  {
    $sort: { createdAt: -1 }
  },
  {
    $group: {
      _id: "$normalizedPhone",
      name: { $first: "$customer.name" },
      phone: { $first: "$customer.phone" },
      district: { $first: "$shippingAddress.district" },
      area: { $first: "$shippingAddress.area" },
      lastOrder: { $first: "$createdAt" },
      firstOrder: { $min: "$createdAt" },
      totalOrders: { $sum: 1 },
      totalOrderValue: { $sum: "$total" },
      deliveredOrders: {
        $sum: {
          $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0]
        }
      },
      cancelledOrders: {
        $sum: {
          $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0]
        }
      }
    }
  }
];

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.max(1, Math.min(50, Number.parseInt(req.query.limit, 10) || 15));
    const search = String(req.query.search || "").trim().slice(0, 80);

    const searchStages = search ? [{
      $match: {
        $or: [
          { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
          { phone: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
          { district: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
        ]
      }
    }] : [];

    const [result] = await Order.aggregate([
      ...groupedCustomers,
      ...searchStages,
      {
        $facet: {
          customers: [
            { $sort: { lastOrder: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ],
          summary: [{
            $group: {
              _id: null,
              totalCustomers: { $sum: 1 },
              repeatCustomers: {
                $sum: { $cond: [{ $gt: ["$totalOrders", 1] }, 1, 0] }
              },
              totalOrders: { $sum: "$totalOrders" },
              totalOrderValue: { $sum: "$totalOrderValue" }
            }
          }]
        }
      }
    ]);

    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      data: result.customers,
      summary: result.summary[0] || {
        totalCustomers: 0,
        repeatCustomers: 0,
        totalOrders: 0,
        totalOrderValue: 0
      },
      pagination: { page, limit }
    });
  } catch (error) {
    console.error("Customers list error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load customers"
    });
  }
});

router.get("/:phone/orders", async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);

    if (!/^01[3-9]\d{8}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer phone"
      });
    }

    const orders = await Order.aggregate([
      { $addFields: { normalizedPhone: phoneExpression } },
      { $match: { normalizedPhone: phone } },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      {
        $project: {
          orderNumber: 1,
          createdAt: 1,
          orderStatus: 1,
          paymentStatus: 1,
          paymentMethod: 1,
          customer: 1,
          shippingAddress: 1,
          items: 1,
          subtotal: 1,
          deliveryCharge: 1,
          discount: 1,
          total: 1
        }
      }
    ]);

    res.set("Cache-Control", "no-store");
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Customer order history error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load customer orders"
    });
  }
});

export default router;
