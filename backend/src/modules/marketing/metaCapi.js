import crypto from "node:crypto";
import { MarketingSettings } from "./marketing.model.js";

function decryptToken(value) {
  const key = process.env.META_SETTINGS_ENCRYPTION_KEY || "";
  if (!/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new Error("Meta encryption configuration missing");
  }

  const parts = String(value || "").split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted CAPI token");
  }

  const [iv, tag, encrypted] = parts.map(x =>
    Buffer.from(x, "base64")
  );

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    iv
  );

  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString("utf8");
}

function hash(value) {
  return crypto.createHash("sha256")
    .update(value)
    .digest("hex");
}

export async function sendMetaPurchase(order, req) {
  if (req.body?.marketingConsent !== true) {
    return { skipped: "Marketing consent not granted" };
  }

  const settings = await MarketingSettings.findOne({
    key: "meta-marketing"
  }).lean();

  if (
    !settings?.enabled ||
    !settings?.pixelId ||
    !settings?.encryptedToken
  ) {
    return { skipped: "Meta CAPI is disabled or incomplete" };
  }

  const phone = String(order.customer?.phone || "")
    .replace(/\D/g, "");

  const bdPhone = phone.startsWith("880")
    ? phone
    : phone.startsWith("0")
      ? "88" + phone
      : phone;

  const email = String(order.customer?.email || "")
    .trim()
    .toLowerCase();

  const userData = {
    client_user_agent: req.get("user-agent") || "Unknown"
  };

  if (bdPhone) userData.ph = [hash(bdPhone)];
  if (email) userData.em = [hash(email)];

  const origin = req.get("origin");
  let eventSourceUrl;

  try {
    const parsed = new URL(origin);
    if (["https:", "http:"].includes(parsed.protocol)) {
      eventSourceUrl = parsed.origin + "/order-success";
    }
  } catch {
    // Ignore invalid or missing origin.
  }

  const event = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: `purchase_${order.orderNumber}`,
    action_source: "website",
    user_data: userData,
    custom_data: {
      currency: "BDT",
      value: Number(order.total),
      order_id: order.orderNumber,
      content_type: "product",
      content_ids: order.items.map(item => String(item.product)),
      contents: order.items.map(item => ({
        id: String(item.product),
        quantity: item.quantity,
        item_price: item.price
      })),
      num_items: order.items.reduce(
        (sum, item) => sum + item.quantity, 0
      )
    }
  };

  if (eventSourceUrl) {
    event.event_source_url = eventSourceUrl;
  }

  const payload = { data: [event] };

  if (settings.testMode && settings.testEventCode) {
    payload.test_event_code = settings.testEventCode;
  }

  const accessToken = decryptToken(settings.encryptedToken);

  const response = await fetch(
    `https://graph.facebook.com/v25.0/${settings.pixelId}/events`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000)
    }
  );

  if (!response.ok) {
    throw new Error(`Meta CAPI HTTP ${response.status}`);
  }

  return { sent: true, eventId: event.event_id };
}
