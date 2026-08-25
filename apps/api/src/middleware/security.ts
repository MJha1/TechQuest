import cors from "cors";
import helmet from "helmet";
import { corsOrigins } from "../lib/env.js";

/** Security headers (helmet defaults: nosniff, frameguard, HSTS, etc.). */
export const securityHeaders = helmet();

/**
 * CORS restricted to configured origins, with credentials enabled so the
 * browser can send the Better Auth session cookie cross-origin (web :5173 →
 * api :3001).
 */
export const corsMiddleware = cors({
  origin: corsOrigins,
  credentials: true,
});
