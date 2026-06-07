import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("buildflow_access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function saveSession(payload) {
  localStorage.setItem("buildflow_access", payload.access);
  localStorage.setItem("buildflow_refresh", payload.refresh);
  localStorage.setItem("buildflow_user", JSON.stringify(payload.user));
}

export function clearSession() {
  localStorage.removeItem("buildflow_access");
  localStorage.removeItem("buildflow_refresh");
  localStorage.removeItem("buildflow_user");
}

export function currentUser() {
  const raw = localStorage.getItem("buildflow_user");
  return raw ? JSON.parse(raw) : null;
}

export function unwrapList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}
