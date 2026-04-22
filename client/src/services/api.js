import axios from "axios";

const normalizeApiUrl = (value) => {
  if (!value || typeof value !== "string") return "http://localhost:5000/api";
  const trimmed = value.trim();
  if (!trimmed) return "http://localhost:5000/api";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
};

const api = axios.create({
  baseURL: normalizeApiUrl(import.meta.env.VITE_API_URL),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gympe_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
