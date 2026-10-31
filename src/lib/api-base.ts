/**
 * Base URL for all API calls.
 *
 * - Default (empty): relative `/api/...` paths — same-origin, works for the
 *   full-stack deploys (RUN-WINDOWS.bat, whole app on one host, Netlify proxy).
 * - When the frontend is deployed separately (e.g. Netlify) and the backend
 *   (API + database) lives on Render, set NEXT_PUBLIC_API_URL on the frontend
 *   host to the Render URL, e.g. `https://crm-pro-backend.onrender.com`
 *   (no trailing slash). The backend has CORS enabled via src/middleware.ts.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(
  /\/+$/,
  ""
);

/** Prefix a relative /api path with the configured base URL. */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
