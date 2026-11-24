import { Router } from "express";
import { Product } from "../products/product.model.js";

const router = Router();

const SITE_URL = "https://everything-bd.com";

function escapeXml(value) {
  return String(value).replace(
    /[<>&"']/g,
    character => ({
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;"
    })[character]
  );
}

function urlEntry(path, updatedAt) {
  const location = escapeXml(
    `${SITE_URL}${path}`
  );

  const date = updatedAt
    ? new Date(updatedAt)
    : null;

  const lastmod =
    date && Number.isFinite(date.getTime())
      ? `<lastmod>${date.toISOString()}</lastmod>`
      : "";

  return `
  <url>
    <loc>${location}</loc>
    ${lastmod}
  </url>`;
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    const products = await Product.find({
      status: "active"
    })
      .select("slug updatedAt")
      .sort({ slug: 1 })
      .lean();

    const entries = [
      urlEntry("/"),
      urlEntry("/shop"),
      urlEntry("/about")
    ];

    const seen = new Set();

    for (const product of products) {
      const slug = String(
        product.slug || ""
      ).trim();

      if (
        !/^[a-z0-9-]+$/.test(slug) ||
        seen.has(slug)
      ) {
        continue;
      }

      seen.add(slug);

      entries.push(
        urlEntry(
          `/product/${encodeURIComponent(slug)}`,
          product.updatedAt
        )
      );
    }


    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      entries.join("") +
      "\n</urlset>";

    res.set(
      "Cache-Control",
      "public, max-age=300"
    );

    return res
      .type("application/xml")
      .send(xml);

  } catch (error) {
    console.error(
      "Sitemap generation failed:",
      error.message
    );

    res.set("Cache-Control", "no-store");

    return res
      .status(503)
      .type("text/plain")
      .send("Sitemap temporarily unavailable");
  }
});

export default router;
