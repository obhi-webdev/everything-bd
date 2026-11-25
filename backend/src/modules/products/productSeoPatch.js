// Convert validated SEO updates into field-level MongoDB paths.
// Omitted SEO fields must never overwrite stored values.

export function buildProductUpdateSet(patch) {
  const { seo, ...fields } = patch;

  if (!seo) return fields;

  if (Object.hasOwn(seo, "title")) {
    fields["seo.title"] = seo.title;
  }

  if (Object.hasOwn(seo, "description")) {
    fields["seo.description"] = seo.description;
  }

  return fields;
}
