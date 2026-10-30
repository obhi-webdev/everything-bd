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

export async function submitOrder(payload) {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Unable to place order"
    );
  }

  return result;
}
