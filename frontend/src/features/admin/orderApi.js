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
  list(token, page = 1, status = "", trash = false) {
    const params = new URLSearchParams({
      page: String(page),
      limit: "15"
    });

    if (status) {
      params.set("status", status);
    }

    if (trash) {
      params.set("trash", "1");
    }

    return request(
      `/admin/orders?${params.toString()}`,
      token
    );
  },

  async archive(token, id, orderNumber) {
    const response = await fetch(
      `${API_URL}/admin/orders/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderNumber })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to archive order");
    }
    return data;
  },

  async restore(token, id) {
    const response = await fetch(
      `${API_URL}/admin/orders/${encodeURIComponent(id)}/restore`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to restore order");
    }
    return data;
  },

  details(token, id) {
    return request(
      `/admin/orders/${encodeURIComponent(id)}`,
      token
    );
  }
};
