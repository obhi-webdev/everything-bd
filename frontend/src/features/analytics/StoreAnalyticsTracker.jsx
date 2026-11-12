import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

let lastEvent = "";
let lastEventAt = 0;

function eligiblePath(path) {
  return path === "/" ||
    /^\/product\/[a-z0-9-]+$/i.test(path) ||
    /^\/lp\/[a-z0-9-]+$/i.test(path);
}

function sessionId() {
  try {
    let value = sessionStorage.getItem(
      "ebd_anonymous_analytics_session"
    );

    if (value) return value;

    value = crypto.randomUUID();
    sessionStorage.setItem(
      "ebd_anonymous_analytics_session",
      value
    );

    return value;
  } catch {
    return null;
  }
}

export default function StoreAnalyticsTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!eligiblePath(pathname)) return;

    // Respect browser privacy signals.
    if (
      navigator.doNotTrack === "1" ||
      navigator.globalPrivacyControl === true
    ) return;

    const id = sessionId();

    if (!id) return;

    const key = `${id}:${pathname}`;
    const now = Date.now();

    // Prevent React StrictMode and rapid duplicate events.
    if (
      lastEvent === key &&
      now - lastEventAt < 2500
    ) return;

    lastEvent = key;
    lastEventAt = now;

    fetch(`${API_URL}/analytics/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: id,
        path: pathname
      }),
      keepalive: true
    }).catch(() => {
      // Analytics errors must never block shopping.
    });

  }, [pathname]);

  return null;
}
