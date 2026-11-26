const API_URL =
  import.meta.env?.VITE_API_URL ||
  "http://localhost:5001/api";

export async function getCheckoutConfig(signal) {
  const response = await fetch(
    `${API_URL}/checkout/config`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("Delivery information unavailable");
  }

  return response.json();
}

export function readMetaCookies(cookieString = "") {
  const result = {};

  const patterns = {
    _fbp: /^fb\.\d+\.\d+\.\d+$/,
    _fbc: /^fb\.\d+\.\d+\.[A-Za-z0-9_.-]+$/
  };

  for (const entry of String(cookieString).split(";")) {
    const index = entry.indexOf("=");

    if (index < 0) continue;

    const key = entry.slice(0, index).trim();

    if (!Object.hasOwn(patterns, key)) continue;

    try {
      const value = decodeURIComponent(
        entry.slice(index + 1).trim()
      );

      if (
        value.length <= 500 &&
        patterns[key].test(value)
      ) {
        result[key.slice(1)] = value;
      }
    } catch {
      // Ignore malformed cookies.
    }
  }

  return result;
}

export async function submitOrder(payload) {
  const body = { ...payload };

  delete body.marketingAttribution;

  try {
    body.marketingConsent =
      payload.marketingConsent === true &&
      (
        localStorage.getItem(
          "everythingbd_marketing_consent"
        ) === "accepted" ||
        (
          import.meta.env.VITE_META_TRACKING_MODE === "opt_out" &&
          !localStorage.getItem(
            "everythingbd_marketing_consent"
          )
        )
      );

    if (body.marketingConsent) {
      const attribution = readMetaCookies(document.cookie);

      if (Object.keys(attribution).length > 0) {
        body.marketingAttribution = attribution;
      }
    }
  } catch {
    body.marketingConsent = false;
    delete body.marketingAttribution;
  }

  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Unable to place order"
    );
  }

  return result;
}
