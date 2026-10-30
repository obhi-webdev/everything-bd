const API_URL =
  import.meta.env?.VITE_API_URL ||
  "http://localhost:5001/api";

export async function getProductBySlug(slug, signal) {
  const response = await fetch(
    `${API_URL}/products/${encodeURIComponent(slug)}`,
    { signal }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Product not found");
  }

  return result.data;
}
