import { useEffect, useState } from "react";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

export function useWebsiteMedia() {
  const [media, setMedia] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `${API}/website-media`,
          {
            signal: controller.signal,
            cache: "no-store"
          }
        );

        if (!response.ok) {
          throw new Error("Website media unavailable");
        }

        const result = await response.json();

        if (!controller.signal.aborted) {
          setMedia(
            Object.fromEntries(
              (result.data || []).map(item => [
                item.key,
                item
              ])
            )
          );
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Website media:", error.message);
        }
      }
    }

    load();

    return () => controller.abort();
  }, []);

  return media;
}
