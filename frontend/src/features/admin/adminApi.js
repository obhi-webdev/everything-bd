const API_URL = import.meta.env.VITE_API_URL
  || "http://localhost:5001/api";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    });
  } catch {
    throw new Error("Cannot connect to EverythingBD server");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const adminApi = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  me: (token) =>
    request("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
};
