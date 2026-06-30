// Browser-side API base. Inlined at build time (NEXT_PUBLIC_*). Defaults to the
// nginx-proxied path so the SPA and API share one origin (no CORS).
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost/api";

// localStorage keys for the backend-issued JWT pair (see CLAUDE.md decision).
export const TOKEN_KEYS = {
  access: "sm_access",
  refresh: "sm_refresh",
};
