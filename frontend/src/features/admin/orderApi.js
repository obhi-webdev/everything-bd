const API_URL =
  import.meta.env?.VITE_API_URL ||
  "http://localhost:5001/api";

async function request(path, token) {
  if (!token) {
    throw new Error("Admin login required");
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}


async function updateOrderStatus(token, id, status) {
  const response = await fetch(
    `${API_URL}/admin/orders/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Update failed");
  }

  return result;
}

export const orderApi = {
  updateStatus: updateOrderStatus,
  list(token, page = 1, status = "") {
    const params = new URLSearchParams({
      page: String(page),
      limit: "15"
    });

    if (status) {
      params.set("status", status);
    }

    return request(
      `/admin/orders?${params.toString()}`,
      token
    );
  },

  details(token, id) {
    return request(
      `/admin/orders/${encodeURIComponent(id)}`,
      token
    );
  }
};
