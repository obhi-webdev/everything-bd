import { useEffect, useState } from "react";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

export function useCategories() {
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/categories`, {
      signal: controller.signal,
      cache: "no-store"
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Category API unavailable");
        }
        return response.json();
      })
      .then(result => {
        if (!controller.signal.aborted) {
          setCategories(result.data || []);
        }
      })
      .catch(error => {
        if (error.name !== "AbortError") {
          console.warn("Category API:", error.message);
        }
      });

    return () => controller.abort();
  }, []);

  return categories;
}
