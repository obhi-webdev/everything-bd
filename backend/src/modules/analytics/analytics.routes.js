import { Router } from "express";
import { createHash } from "node:crypto";
import {
  requireAuth,
  requireRole
} from "../../middlewares/requireAuth.js";
import { StoreVisit } from "./visit.model.js";

const router = Router();
const periods = new Set([7, 30, 90]);

const attempts = new Map();

function rateLimited(req) {
  // IP is used temporarily for rate limiting, not stored
  // in the analytics collection.
  const key = req.ip || "unknown";
  const now = Date.now();

  if (attempts.size > 5000) {
    attempts.clear();
  }

  const previous = attempts.get(key);

  if (!previous || now - previous.start > 60000) {
    attempts.set(key, { start: now, count: 1 });
    return false;
  }

  previous.count += 1;
  return previous.count > 90;
}

function classifyPath(path) {
  if (path === "/") return "home";

  if (/^\/product\/[a-z0-9-]+$/i.test(path)) {
    return "product";
  }

  if (/^\/lp\/[a-z0-9-]+$/i.test(path)) {
    return "landing";
  }

  return null;
}

router.post("/view", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");

    if (
      req.get("DNT") === "1" ||
      req.get("Sec-GPC") === "1"
    ) {
      return res.sendStatus(204);
    }

    if (rateLimited(req)) {
      return res.status(429).json({
        success: false,
        message: "Too many requests"
      });
    }

    const { sessionId, path } = req.body || {};

    if (
      typeof sessionId !== "string" ||
      !/^[a-zA-Z0-9-]{20,100}$/.test(sessionId) ||
      typeof path !== "string" ||
      path.length > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics event"
      });
    }

    const kind = classifyPath(path);

    if (!kind) {
      return res.status(400).json({
        success: false,
        message: "Unsupported page"
      });
    }

    const sessionHash = createHash("sha256")
      .update(sessionId)
      .digest("hex");

    await StoreVisit.create({
      sessionHash,
      path,
      kind
    });

    return res.sendStatus(204);
  } catch (error) {
    console.error("Store analytics ingestion failed");
    return res.status(503).json({
      success: false,
      message: "Analytics temporarily unavailable"
    });
  }
});

router.get(
  "/summary",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const days = Number(req.query.days || 7);

    if (!periods.has(days)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics period"
      });
    }

    try {
      const since = new Date(
        Date.now() - days * 86400000
      );

      const filter = {
        createdAt: { $gte: since }
      };

      const [
        pageViews,
        visitorSessions,
        productViews,
        dailyViews
      ] = await Promise.all([
        StoreVisit.countDocuments(filter),

        StoreVisit.distinct(
          "sessionHash",
          filter
        ),

        StoreVisit.countDocuments({
          ...filter,
          kind: "product"
        }),

        StoreVisit.aggregate([
          {
            $match: filter
          },
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
          {
            $sort: { _id: 1 }
          }
        ])
      ]);

      res.set("Cache-Control", "no-store");

      return res.json({
        success: true,
        data: {
          days,
          pageViews,
          uniqueVisitors: visitorSessions.length,
          productViews,
          dailyViews: dailyViews.map(day => ({
            date: day._id,
            views: day.count
          })),
          visitorDefinition: "Unique browser sessions"
        }
      });

    } catch (error) {
      console.error("Admin traffic analytics failed");

      return res.status(500).json({
        success: false,
        message: "Unable to load traffic analytics"
      });
    }
  }
);

export default router;
