import "./privacyChoices.css";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const CONSENT_KEY = "everythingbd_marketing_consent";
const MAX_QUEUE = 50;

let activePixel = "";
let configuredPixel = "";
let pixelPromise = null;
let ready = false;
let eventQueue = [];
let lastPage = "";
let lastPageTime = 0;

export function hasMarketingConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function flushEvents() {
  if (!ready || !hasMarketingConsent() || !window.fbq) {
    return;
  }

  const pending = eventQueue;
  eventQueue = [];

  for (const item of pending) {
    try {
      if (item.eventId) {
        window.fbq(
          "track",
          item.name,
          item.params,
          { eventID: item.eventId }
        );
      } else {
        window.fbq("track", item.name, item.params);
      }
    } catch {
      // Tracking must never interrupt the storefront.
    }
  }
}

export function trackMetaEvent(name, params = {}, eventId) {
  if (!hasMarketingConsent()) return false;

  if (eventQueue.length >= MAX_QUEUE) {
    eventQueue.shift();
  }

  eventQueue.push({
    name,
    params,
    eventId,
    createdAt: Date.now()
  });

  flushEvents();
  return true;
}

function loadPixel(pixelId) {
  if (ready && activePixel === pixelId) {
    return Promise.resolve();
  }

  if (pixelPromise) return pixelPromise;

  pixelPromise = new Promise((resolve, reject) => {
    if (!window.fbq) {
      const fbq = function() {
        if (fbq.callMethod) {
          fbq.callMethod.apply(fbq, arguments);
        } else {
          fbq.queue.push(arguments);
        }
      };

      fbq.queue = [];
      fbq.loaded = true;
      fbq.version = "2.0";
      window.fbq = window._fbq = fbq;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";

    script.onload = () => {
      try {
        window.fbq("set", "autoConfig", false, pixelId);
        window.fbq("init", pixelId);
        activePixel = pixelId;
        ready = true;
        flushEvents();
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    script.onerror = () => {
      pixelPromise = null;
      reject(new Error("Meta Pixel script failed to load"));
    };

    document.head.appendChild(script);
  });

  return pixelPromise;
}

export default function MetaPixel() {
  const location = useLocation();
  const [pixelId, setPixelId] = useState("");
  const [consent, setConsent] = useState(() => {
    try {
      return localStorage.getItem(CONSENT_KEY) || "";
    } catch {
      return "";
    }
  });
  const [showChoices, setShowChoices] = useState(false);

  useEffect(() => {
    const openPrivacyChoices = () => {
      setShowChoices(true);
    };

    window.addEventListener(
      "everythingbd:open-privacy-choices",
      openPrivacyChoices
    );

    return () => {
      window.removeEventListener(
        "everythingbd:open-privacy-choices",
        openPrivacyChoices
      );
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    fetch(`${API}/marketing/public`, { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Settings unavailable");
        return response.json();
      })
      .then(result => {
        if (!mounted) return;
        const next = result.data?.enabled
          ? String(result.data.pixelId || "")
          : "";

        configuredPixel = next;
        setPixelId(next);

        if (!next) eventQueue = [];
      })
      .catch(() => {
        if (mounted) {
          configuredPixel = "";
          eventQueue = [];
        }
      });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!pixelId || consent !== "accepted") return;
    loadPixel(pixelId).catch(() => {});
  }, [pixelId, consent]);

  useEffect(() => {
    if (
      !pixelId ||
      consent !== "accepted" ||
      location.pathname.startsWith("/admin")
    ) return;

    const page = location.pathname + location.search;
    const now = Date.now();

    if (page === lastPage && now - lastPageTime < 750) {
      return;
    }

    lastPage = page;
    lastPageTime = now;
    trackMetaEvent("PageView");
  }, [pixelId, consent, location.pathname, location.search]);

  function choose(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      return;
    }

    if (value !== "accepted") {
      eventQueue = [];
    }

    setConsent(value);
    setShowChoices(false);

    if (value === "accepted") {
      window.dispatchEvent(
        new Event("everythingbd:marketing-consent-accepted")
      );
    }
  }



  return (
    <>
{showChoices && (
        <div
          role="region"
          aria-label="Marketing privacy choices"
          className="ebd-meta-consent"
        >
          <p>
            Optional marketing cookies help us measure ads
            and shopping activity. You can change your
            choice at any time.
          </p>
          <div className="ebd-meta-consent-actions">
            <button
              type="button"
              onClick={() => choose("declined")}
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => choose("accepted")}
            >
              Accept Marketing Cookies
            </button>
          </div>
        </div>
      )}
    </>
  );
}
