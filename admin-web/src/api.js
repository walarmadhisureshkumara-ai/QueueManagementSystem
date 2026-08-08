// Backend API base URL — change this to match your server address
const API = "http://localhost:3000";

// Helper: generic fetch wrapper with error handling
async function request(url, options = {}) {
  try {
    const res = await fetch(`${API}${url}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    return await res.json();
  } catch (err) {
    console.error(`API Error [${url}]:`, err);
    return { success: false, message: "Server unreachable" };
  }
}

// ─── AUTH ─────────────────────────────────────
export const loginAPI = (email, password) =>
  request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

// ─── STAFF ─────────────────────────────────────
export const getStaffAPI = () => request("/staff");
export const addStaffAPI = (data) =>
  request("/staff/add", { method: "POST", body: JSON.stringify(data) });
export const deleteStaffAPI = (id) =>
  request(`/staff/delete/${id}`, { method: "DELETE" });

// ─── COUNTERS ──────────────────────────────────
export const getCountersAPI = () => request("/counters");
export const addCounterAPI = (data) =>
  request("/counter/add", { method: "POST", body: JSON.stringify(data) });
export const assignCounterAPI = (counter_id, staff_id) =>
  request("/counter/assign", {
    method: "POST",
    body: JSON.stringify({ counter_id, staff_id }),
  });
export const updateCounterAPI = (counter_id, data) =>
  request(`/counters/update/${counter_id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

// ─── TOKENS (Staff) ────────────────────────────
export const getStaffTokensAPI = (counterId) =>
  request(`/staff/tokens/${counterId}`);
export const updateTokenStatusAPI = (tokenId, action) =>
  request(`/staff/tokens/${tokenId}/${action}`, { method: "PUT" });
export const generateTokenAPI = (tokenId) =>
  request(`/staff/generate-token/${tokenId}`, { method: "POST" });
export const requestTokenAPI = (data) =>
  request("/request-token", { method: "POST", body: JSON.stringify(data) });

// ─── REPORTS ───────────────────────────────────
export const getReportsAPI = () => request("/report");

// ─── SETTINGS ──────────────────────────────────
export const updateSettingsAPI = (data) =>
  request("/settings/update", {
    method: "PUT",
    body: JSON.stringify(data),
  });

export default API;
