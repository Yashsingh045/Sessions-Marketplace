// Fetch wrapper: prefixes the API base, attaches the JWT, transparently
// refreshes on 401 (once), and normalizes DRF error shapes into a message.
import { API_BASE, TOKEN_KEYS } from "./config";

export const tokenStore = {
  get access() {
    return typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_KEYS.access)
      : null;
  },
  get refresh() {
    return typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_KEYS.refresh)
      : null;
  },
  set(access, refresh) {
    if (typeof window === "undefined") return;
    if (access) localStorage.setItem(TOKEN_KEYS.access, access);
    if (refresh) localStorage.setItem(TOKEN_KEYS.refresh, refresh);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
  },
};

// The AuthProvider registers a callback so a hard 401 can reset app state.
let authFailureHandler = null;
export function setAuthFailureHandler(fn) {
  authFailureHandler = fn;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function extractError(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(" ");
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return first.join(" ");
  if (typeof first === "string") return first;
  return fallback;
}

async function refreshAccessToken() {
  const refresh = tokenStore.refresh;
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    tokenStore.set(data.access, null);
    return data.access;
  } catch {
    return null;
  }
}

export async function apiFetch(
  path,
  { method = "GET", body, auth = true, _retry = false } = {}
) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && tokenStore.access) {
    headers["Authorization"] = `Bearer ${tokenStore.access}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Token expired → try a single silent refresh, then retry the request.
  if (res.status === 401 && auth && !_retry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiFetch(path, { method, body, auth, _retry: true });
    }
    tokenStore.clear();
    if (authFailureHandler) authFailureHandler();
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(
      extractError(data, `Request failed (${res.status})`),
      res.status,
      data
    );
  }
  return data;
}
