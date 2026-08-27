import cors from "cors";
import helmet from "helmet";
import { corsOrigins } from "../lib/env.js";

/**
 * SHA-256 of the inline dark-mode pre-paint script in apps/web/index.html.
 * Helmet's default CSP is `script-src 'self'`, which blocks inline scripts —
 * that would stop the pre-paint script from running, so the app would always
 * load in light mode (and a saved dark preference wouldn't re-apply on reload).
 * Allowlisting the script by hash keeps the CSP strict while letting it run.
 *
 * IMPORTANT: if you edit that inline script, this hash MUST be updated or dark
 * mode silently breaks again. Recompute with:
 *   node -e 'const fs=require("fs"),c=require("crypto");const h=fs.readFileSync("apps/web/dist/index.html","utf8").match(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/)[1];console.log("sha256-"+c.createHash("sha256").update(h,"utf8").digest("base64"))'
 */
const THEME_SCRIPT_HASH = "'sha256-qsNTxfuPWA1Y9idMdSk/Th8Or61V1DQ+6cKwNCkqdv0='";

/** Security headers (helmet defaults: nosniff, frameguard, HSTS, etc.). */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", THEME_SCRIPT_HASH],
    },
  },
});

/**
 * CORS restricted to configured origins, with credentials enabled so the
 * browser can send the Better Auth session cookie cross-origin (web :5173 →
 * api :3001).
 */
export const corsMiddleware = cors({
  origin: corsOrigins,
  credentials: true,
});
