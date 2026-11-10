export function validateProductInventory(product) {
  const enabled = product.hasSizeVariants === true;
  const variants = product.sizeVariants || [];
  const totalStock = Number(product.stock);

  if (!Number.isSafeInteger(totalStock) || totalStock < 0) {
    return "Total stock must be a non-negative integer";
  }

  if (!enabled) {
    if (variants.length > 0) {
      return "Disable size variations only after clearing size entries";
    }
    return null;
  }

  if (!Array.isArray(variants) ||
      variants.length < 1 ||
      variants.length > 30) {
    return "Add between 1 and 30 size variations";
  }

  const seen = new Set();
  let sum = 0;

  for (const variant of variants) {
    const size = String(variant.size || "").trim().toUpperCase();
    const quantity = Number(variant.stock);

    if (!/^[A-Z0-9 -]{1,30}$/.test(size)) {
      return "Invalid size label";
    }

    if (seen.has(size)) {
      return "Duplicate sizes are not allowed";
    }

    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      return "Size stock must be a non-negative integer";
    }

    seen.add(size);
    sum += quantity;
  }

  if (!Number.isSafeInteger(sum) || sum !== totalStock) {
    return "Total stock must equal the sum of size stocks";
  }

  return null;
}
