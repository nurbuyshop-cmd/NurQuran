"use client";
// API client for apiquran. In the live preview (window.__MOCK_API__) it uses an in-browser demo store instead.
import { mockRequest } from "./mock";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://apiquran.toptol.site").replace(/\/$/, "");
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://nurquran.toptol.site").replace(/\/$/, "");
const TOKEN = "qa_token";

export const getToken = () => { try { return localStorage.getItem(TOKEN); } catch (e) { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN); } catch (e) {} };
const isMock = () => typeof window !== "undefined" && window.__MOCK_API__;

export class ApiError extends Error {
  constructor(message, status, errors) { super(message); this.status = status; this.errors = errors || [message]; }
}

export async function api(path, { method = "GET", body, form } = {}) {
  if (isMock()) {
    const r = await mockRequest(path, method, body, form, getToken());
    if (!r.ok) throw new ApiError(r.error, r.status || 400, r.errors);
    return r;
  }
  const headers = {};
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (body && !form) headers["Content-Type"] = "application/json";
  let res;
  try {
    res = await fetch(API_URL + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  } catch (e) {
    throw new ApiError("Cannot reach the API server. Check your internet or the API address.", 0);
  }
  let data = {};
  try { data = await res.json(); } catch (e) {}
  if (res.status === 401 && path !== "/v1/auth/login") {
    setToken(null);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("qa-logout"));
  }
  if (!res.ok || data.ok === false) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.errors);
  return data;
}

// Download the full backup file
export async function downloadBackup() {
  if (isMock()) {
    const r = await mockRequest("/v1/admin/export", "GET", null, null, getToken());
    return new Blob([JSON.stringify(r.file, null, 1)], { type: "application/json" });
  }
  const res = await fetch(API_URL + "/v1/admin/export", { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new ApiError("Could not download backup", res.status);
  return res.blob();
}
