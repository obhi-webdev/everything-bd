import { Product } from "./product.model.js";

const CATEGORY_ALIASES = new Map([
  ["ladies dress collection", "Ladies Dress Collection"],
  ["ladies two piece and kurti collection", "Ladies Dress Collection"],

  ["baby dress", "Baby Dress"],

  ["beauty product", "Beauty Products"],
  ["beauty products", "Beauty Products"],

  ["k-beauty product", "Beauty Products"],
  ["k-beauty products", "Beauty Products"],

  ["sunscreen", "Beauty Products"],
  ["cleanser", "Beauty Products"],
  ["serum", "Beauty Products"],
  ["moisturizer", "Beauty Products"]
]);

function categoryKey(value) {
  return String(value || "")
    .trim()
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function displayCategory(value) {
  const key = categoryKey(value);
  return CATEGORY_ALIASES.get(key) || String(value || "").trim();
}


export async function getProducts(req, res, next) {
  try {
    const positiveInteger = (value, fallback) => {
      const n = Number(value);
      return Number.isSafeInteger(n) && n > 0 ? n : fallback;
    };

    const page = Math.min(100000, positiveInteger(req.query.page, 1));
    const limit = Math.min(48, positiveInteger(req.query.limit, 12));
    const filter = { status: "active" };

    const stringParam = (value, max = 120) =>
      typeof value === "string" ? value.trim().slice(0, max) : "";

    const category = stringParam(req.query.category);
    const brand = stringParam(req.query.brand);
    const search = stringParam(req.query.q, 100);
    const flag = stringParam(req.query.flag);
    const sort = stringParam(req.query.sort);

    if (category) {
      const requestedKey = categoryKey(category);
      const allCategories = await Product.distinct("category", {
        status: "active"
      });

      const matches = allCategories.filter(
        name => categoryKey(displayCategory(name)) === requestedKey ||
          categoryKey(name) === requestedKey
      );

      filter.category = { $in: matches };
    }
    if (brand) filter.brand = brand;

    const parsePrice = value => {
      if (value === undefined || value === "") return null;
      if (typeof value !== "string" && typeof value !== "number") return NaN;
      const n = Number(value);
      return Number.isFinite(n) && n >= 0 ? n : NaN;
    };

    const minPrice = parsePrice(req.query.minPrice);
    const maxPrice = parsePrice(req.query.maxPrice);

    if (Number.isNaN(minPrice) || Number.isNaN(maxPrice) ||
        (minPrice !== null && maxPrice !== null && minPrice > maxPrice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid price range"
      });
    }

    if (minPrice !== null || maxPrice !== null) {
      filter.price = {};
      if (minPrice !== null) filter.price.$gte = minPrice;
      if (maxPrice !== null) filter.price.$lte = maxPrice;
    }

    if (flag === "featured") filter.isFeatured = true;

    if (flag === "new") {
      const days = 30;
      filter.createdAt = {
        $gte: new Date(Date.now() - days * 86400000)
      };
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { name: regex },
        { brand: regex },
        { category: regex },
        { sku: regex }
      ];
    }

    const sortOptions = {
      latest: { createdAt: -1, _id: -1 },
      oldest: { createdAt: 1, _id: 1 },
      price_asc: { price: 1, _id: -1 },
      price_desc: { price: -1, _id: -1 },
      name_asc: { name: 1, _id: 1 }
    };

    const ordering = sortOptions[sort] || sortOptions.latest;
    const skip = (page - 1) * limit;

    const [products, total, categoryNames, brandNames] = await Promise.all([
      Product.find(filter)
        .sort(ordering)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
      Product.distinct("category", { status: "active" }),
      Product.distinct("brand", { status: "active" })
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        categories: [...new Set(
          categoryNames
            .filter(Boolean)
            .map(displayCategory)
        )].sort((a, b) => a.localeCompare(b)),
        brands: brandNames.filter(Boolean).sort()
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      status: "active"
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}
