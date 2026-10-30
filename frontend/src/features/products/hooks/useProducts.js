import { useEffect, useState } from "react";

const API_URL =
  import.meta.env?.VITE_API_URL ||
  "http://localhost:5001/api";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/products?limit=48`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const result = await response.json();

        const normalized = (result.data || []).map((p) => ({
          id: p._id,
          slug: p.slug,
          sku: p.sku,
          name: p.name,
          brand: p.brand || "EverythingBD",
          category: p.category,
          price: p.price,
          oldPrice: p.compareAtPrice,
          stock: p.stock,
          rating: null,
          badge: p.isFeatured ? "FEATURED" : "NEW",
          image: p.images?.[0]?.url || "",
          images: p.images || [],
          description: p.description || ""
        }));

        if (!controller.signal.aborted) {
          setProducts(normalized);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, []);

  return { products, loading, error };
}
