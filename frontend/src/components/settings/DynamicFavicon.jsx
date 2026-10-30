import { useEffect } from "react";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

export default function DynamicFavicon() {
  useEffect(() => {
    let cancelled = false;

    const original =
      document.querySelector('link[rel="icon"]');

    const defaultHref =
      original?.getAttribute("href") || "/vite.svg";

    async function refreshFavicon() {
      try {
        const response = await fetch(`${API}/site-settings`, {
          cache: "no-store"
        });

        if (!response.ok) return;

        const result = await response.json();
        if (cancelled) return;

        let link = document.querySelector('link[rel="icon"]');

        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }

        const faviconUrl = result.data?.faviconUrl;

        link.type = faviconUrl ? "image/png" : "";
        link.href = faviconUrl || defaultHref;
      } catch {
        // Keep existing favicon if the API is unavailable.
      }
    }

    refreshFavicon();

    window.addEventListener(
      "everythingbd:settings-updated",
      refreshFavicon
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "everythingbd:settings-updated",
        refreshFavicon
      );
    };
  }, []);

  return null;
}
