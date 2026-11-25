import { PRODUCT_SEO_DESCRIPTIONS } from "./productSeoDescriptions.js";
import { contentFingerprint } from "./seoFingerprint.js";

const MAX_LENGTH = 160;

const length = value =>
  Array.from(value).length;

export function normalizeDescription(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .replace(/[\uFE0E\uFE0F]/gu, "")
    .replace(/[•▪●◆★]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function cleanContent(value) {
  return normalizeDescription(value)
    .replace(
      /^(?:পণ্যের\s*ডিসক্রিপশন|পণ্য\s*পরিচিতি|ডেসক্রিপশন|Description|Product Overview)(?:\s*\([^)]*\))?\s*:?\s*/iu,
      ""
    )
    .replace(/^[#®™\s]+/u, "")
    .trim();
}

function shorten(value, limit = MAX_LENGTH) {
  const text = normalizeDescription(value);

  if (limit <= 0) return "";

  if (length(text) <= limit) {
    return text;
  }

  const sentences = [
    ...new Intl.Segmenter(
      undefined,
      { granularity: "sentence" }
    ).segment(text)
  ];

  let complete = "";

  for (const item of sentences) {
    const next = (
      complete + " " + item.segment.trim()
    ).trim();

    if (length(next) > limit) break;

    complete = next;
  }

  if (
    length(complete) >= Math.min(70, limit * 0.6) &&
    /[.!?।]$/u.test(complete)
  ) {
    return complete;
  }

  let output = "";

  for (const word of text.split(/\s+/u)) {
    const next = output
      ? `${output} ${word}`
      : word;

    if (length(next) > limit - 1) break;

    output = next;
  }

  if (!output) {
    const segments = new Intl.Segmenter(
      undefined,
      { granularity: "grapheme" }
    );

    for (const item of segments.segment(text)) {
      if (
        length(output + item.segment) >
        limit - 1
      ) break;

      output += item.segment;
    }
  }

  output = output
    .replace(/[\s,;:–—|]+$/u, "")
    .trim();

  return output ? `${output}…` : "";
}


function completeExcerpt(value, limit) {
  const text = normalizeDescription(value);

  if (!text || limit <= 0) return "";

  if (
    length(text) <= limit &&
    !/(?:…|\.{3})$/u.test(text)
  ) {
    return text;
  }

  const sentences = new Intl.Segmenter(
    undefined,
    { granularity: "sentence" }
  ).segment(text);

  let output = "";

  for (const item of sentences) {
    const sentence = item.segment.trim();

    if (!/[.!?।]$/u.test(sentence)) continue;
    if (/(?:…|\.{3})$/u.test(sentence)) continue;

    // Ignore standalone numbered list markers.
    if (/^[\p{N}\s.)।:-]+$/u.test(sentence)) {
      continue;
    }

    // Ignore promotional questions.
    if (/\?$/u.test(sentence)) {
      continue;
    }

    // Require meaningful letters.
    if (!/\p{L}/u.test(sentence)) {
      continue;
    }

    // Ignore section headings with numbered markers.
    if (
      /:\s*[\p{N}\s.)।-]*$/u.test(sentence)
    ) {
      continue;
    }

    const next = `${output} ${sentence}`.trim();

    if (length(next) > limit) continue;

    output = next;
  }

  return output;
}

function catalogDescription(product) {
  const slug = product?.slug || "";

  if (!Object.hasOwn(PRODUCT_SEO_DESCRIPTIONS, slug)) {
    return "";
  }

  const entry = PRODUCT_SEO_DESCRIPTIONS[slug];

  if (
    contentFingerprint(
      normalizeDescription(product.name)
    ) !== entry.nameFingerprint
  ) {
    return "";
  }

  if (
    contentFingerprint(
      normalizeDescription(product.description)
    ) !== entry.descriptionFingerprint
  ) {
    return "";
  }

  return entry.description;
}

function automaticFallback(title) {
  const suffix =
    "। EverythingBD থেকে অর্ডার করুন।";

  const budget = MAX_LENGTH - length(suffix);

  const identity = shorten(title, budget)
    .replace(/(?:…|\.{3})$/u, "")
    .trim();

  return identity
    ? `${identity}${suffix}`
    : "EverythingBD থেকে পণ্য অর্ডার করুন।";
}

export function generateProductDescription(
  product = {},
  optimizedTitle = ""
) {
  const custom = normalizeDescription(
    product.seo?.description
  );

  if (custom) {
    return shorten(custom);
  }

  const curated = catalogDescription(product);

  if (curated) return curated;

  const title = normalizeDescription(
    optimizedTitle || product.name
  )
    .replace(/\s*\|\s*EverythingBD$/i, "")
    .trim();

  const content = cleanContent(
    product.description
  );

  const cta =
    "EverythingBD থেকে অর্ডার করুন।";

  if (!title) {
    return shorten(content);
  }

  if (!content) {
    return shorten(
      `${title} — ${cta} সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।`
    );
  }

  const normalizedTitle = title.toLowerCase();

  const containsTitle = content
    .toLowerCase()
    .includes(normalizedTitle);

  const prefix = containsTitle
    ? ""
    : `${title} — `;

  const available =
    MAX_LENGTH - length(prefix);

  if (available < 45) {
    return automaticFallback(title);
  }

  const excerpt = completeExcerpt(
    content,
    available
  );

  if (!excerpt) {
    return automaticFallback(title);
  }

  return shorten(
    `${prefix}${excerpt}`
  );
}
