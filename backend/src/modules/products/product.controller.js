import { Product } from "./product.model.js";

export async function getProducts(req, res, next) {
  try {
    const page = Math.max(
      1,
      Math.trunc(Number(req.query.page) || 1)
    );

    const limit = Math.min(
      48,
      Math.max(1, Math.trunc(Number(req.query.limit) || 12))
    );

    const filter = { status: "active" };

    if (typeof req.query.category === "string") {
      filter.category = req.query.category;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: products,
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
