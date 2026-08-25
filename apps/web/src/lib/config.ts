/**
 * Base URL for API + auth requests. Empty (same-origin) in dev, where Vite
 * proxies `/api` to the Express server. In production set `VITE_API_URL` to the
 * API origin. Only `VITE_`-prefixed vars reach the browser bundle — no server
 * secret is ever exposed here.
 */
export const API_BASE: string = import.meta.env.VITE_API_URL ?? "";
