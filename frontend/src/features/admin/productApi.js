const API_URL =
  import.meta.env?.VITE_API_URL ||
  "http://localhost:5001/api";

async function apiRequest(path, token, options = {}) {
  if (!token) {
    throw new Error("Admin login required");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

export const productApi = {
  list(token) {
    return apiRequest("/admin/products", token);
  },

  create(token, product) {
    return apiRequest("/admin/products", token, {
      method: "POST",
      body: JSON.stringify(product)
    });
  },

  update(token, id, product) {
    return apiRequest(`/admin/products/${id}`, token, {
      method: "PATCH",
      body: JSON.stringify(product)
    });
  },

  archive(token, id) {
    return apiRequest(`/admin/products/${id}`, token, {
      method: "DELETE"
    });
  }
};
