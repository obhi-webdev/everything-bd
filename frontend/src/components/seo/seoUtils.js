import { generateProductDescription } from "./seoDescriptions.js";
import {
  PRODUCT_SEO_TITLES,
  PRODUCT_SEO_TITLE_FINGERPRINTS
} from "./productSeoTitles.js";
import { contentFingerprint } from "./seoFingerprint.js";
import { normalizeDescription } from "./seoDescriptions.js";

export const SITE_URL = "https://everything-bd.com";

export const DEFAULT_TITLE =
  "EverythingBD | Korean Skincare, Fashion, Gadgets & Daily Essentials";

export const DEFAULT_DESCRIPTION =
  "EverythingBD-তে পাচ্ছেন অরিজিনাল কোরিয়ান স্কিনকেয়ার, লেডিস কুর্তি, বাচ্চাদের পোশাক, লেদার আইটেম এবং স্মার্ট গ্যাজেট। সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।";

export function cleanText(value, limit = 160) {
  return Array.from(
    String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  ).slice(0, limit).join("");
}

export function safeImage(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function normalizeProductTitle(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(?:\s*\|\s*EverythingBD)+$/i, "")
    .replace(/^\s*\d+\.\s+/, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\uFE0F\uFE0E\u200D]/g, "")
    .replace(/^[\s#•®™*"'“”]+/u, "")
    .replace(/[\s"'“”]+$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function productTitle(product) {
  const custom = normalizeProductTitle(
    product?.seo?.title
  );

  const slug = product?.slug || "";

  // Curated title freshness guard
  const catalogTitle =
    Object.hasOwn(PRODUCT_SEO_TITLES, slug) &&
    Object.hasOwn(PRODUCT_SEO_TITLE_FINGERPRINTS, slug) &&
    contentFingerprint(
      normalizeDescription(product?.name)
    ) === PRODUCT_SEO_TITLE_FINGERPRINTS[slug]
      ? PRODUCT_SEO_TITLES[slug]
      : "";

  const automatic = normalizeProductTitle(
    product?.name
  );

  const title = custom ||
    catalogTitle ||
    automatic;

  return title
    ? `${title} | EverythingBD`
    : DEFAULT_TITLE;
}

export function productDescription(product) {
  return generateProductDescription(
    product,
    productTitle(product)
  );
}

function normalizeSchemaBrand(value) {
  return cleanText(value, 200)
    .replace(/^[\s"'“”‘’•#]+/u, "")
    .replace(/[\s"'“”‘’]+$/u, "")
    .trim();
}

export function buildProductSchema(product) {
  if (!product?.name || !product?.slug) return null;

  const price = Number(product.price);

  if (
    product.price == null ||
    product.price === "" ||
    !Number.isFinite(price) ||
    price < 0
  ) return null;

  const images = (product.images || [])
    .map(image => safeImage(image?.url))
    .filter(Boolean);

  if (!images.length) return null;

  const available = product.hasSizeVariants
    ? (product.sizeVariants || []).some(
        variant => Number(variant.stock) > 0
      )
    : Number(product.stock) > 0;

  const url =
    `${SITE_URL}/product/${encodeURIComponent(product.slug)}`;

  const description = cleanText(
    product.description, 5000
  ) || cleanText(product.name, 5000);

  const brand = normalizeSchemaBrand(product.brand);
  const sku = cleanText(product.sku, 200);
  const category = cleanText(product.category, 300);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    url,
    ...(description ? { description } : {}),
    ...(sku ? { sku } : {}),
    ...(brand ? {
      brand: {
        "@type": "Brand",
        name: brand
      }
    } : {}),
    ...(category ? { category } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BDT",
      price: price.toFixed(2),
      availability: available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "EverythingBD"
      }
    }
  };
}

export function buildBreadcrumb(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`
    }))
  };
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "EverythingBD",
  url: `${SITE_URL}/`
};
