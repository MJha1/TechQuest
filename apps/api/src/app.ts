import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express, type RequestHandler } from "express";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import type { SessionResolver } from "./lib/auth.js";
import { authNodeHandler, createBetterAuthSessionResolver } from "./lib/better-auth.js";
import { createDefaultAIProvider, type AIProvider } from "./ai/index.js";
import { requestId } from "./middleware/request-id.js";
import { requestLogger } from "./middleware/request-logger.js";
import { corsMiddleware, securityHeaders } from "./middleware/security.js";
import { createRateLimiter } from "./middleware/rate-limit.js";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { apiRouter } from "./routes/index.js";

export interface CreateAppOptions {
  /**
   * Override the session resolver. Defaults to the Better Auth-backed resolver;
   * tests inject a resolver that returns a fixed authenticated user (or null).
   */
  sessionResolver?: SessionResolver;
  /**
   * Override the Better Auth request handler mounted at `/api/auth/*`. Defaults
   * to the real handler; tests inject a fake to assert route wiring without a DB.
   */
  authHandler?: RequestHandler;
  /** Force rate limiting on/off. Defaults to on outside NODE_ENV=test. */
  enableRateLimit?: boolean;
  /** Override rate-limit window/max (used by tests to assert 429s). */
  rateLimit?: { windowMs: number; max: number };
  /**
   * Override the AI provider (LLM boundary). Defaults to the configured provider
   * (Anthropic when a key is set, otherwise a null provider that triggers the
   * safe fallback). Tests inject a mock provider.
   */
  aiProvider?: AIProvider;
}

/**
 * Builds the Express application. Middleware order matters and is intentional:
 *
 *   request-id → request-logger → security headers → CORS → rate limiting
 *   → Better Auth handler (/api/auth/*) → body parsing (size-limited)
 *   → authentication → routes → 404 → errors
 *
 * The Better Auth handler is mounted BEFORE express.json because it consumes the
 * raw request body itself. Rate limiting sits ahead of it so login/signup are
 * brute-force protected. Controllers hold no business logic; the flow is
 * Router → Controller → Service.
 */
export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  app.disable("x-powered-by");
  // Trust the first proxy hop (Railway) so client IPs / rate limiting are correct.
  app.set("trust proxy", 1);

  // Inject the AI provider (controllers read it from app.locals). Not hardcoded.
  app.locals.aiProvider = options.aiProvider ?? createDefaultAIProvider();

  // Observability
  app.use(requestId);
  app.use(requestLogger);

  // Security
  app.use(securityHeaders);
  app.use(corsMiddleware);

  // Rate limiting (scoped to the API surface, incl. /api/auth). Runs before
  // body parsing — it only inspects the client IP/headers.
  const enableRateLimit = options.enableRateLimit ?? env.NODE_ENV !== "test";
  if (enableRateLimit) {
    app.use(
      "/api",
      createRateLimiter(
        options.rateLimit ?? {
          windowMs: env.RATE_LIMIT_WINDOW_MS,
          max: env.RATE_LIMIT_MAX,
        },
      ),
    );
  }

  // Better Auth: signup / login / logout / session endpoints. Mounted before
  // express.json so it can read the raw body. Express 5 named wildcard.
  const authHandler = options.authHandler ?? authNodeHandler;
  app.all("/api/auth/*splat", authHandler);

  // Body parsing with request size limits (applies to the rest of the API)
  app.use(express.json({ limit: env.BODY_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: env.BODY_LIMIT }));

  // Authentication (non-enforcing; guards enforce per route)
  app.use(authenticate(options.sessionResolver ?? createBetterAuthSessionResolver()));

  // Routes
  app.use("/api", apiRouter);

  // In production, serve the built React app from this same origin (so the
  // browser calls /api on the same host — no CORS, cookies just work). Skipped
  // when the build isn't present (e.g. in dev, where Vite serves the frontend).
  serveWebApp(app);

  // Fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Serve the compiled React SPA and fall back to index.html for client-side
 * routes. Mounted after the API router, so `/api/*` is never shadowed; unmatched
 * `/api` paths still reach the JSON 404 handler.
 */
function serveWebApp(app: Express): void {
  // Only in production (or when a path is explicitly configured) — in dev/test
  // the frontend is served by Vite and we must not shadow route behavior.
  if (env.NODE_ENV !== "production" && !env.WEB_DIST) return;

  // Explicit path wins; otherwise look for the sibling web build next to the API
  // build (apps/api/dist/.. → apps/web/dist), which is how the container lays it out.
  const webDist = env.WEB_DIST || fileURLToPath(new URL("../../web/dist", import.meta.url));
  const indexHtml = join(webDist, "index.html");
  if (!existsSync(indexHtml)) return; // no build present → nothing to serve (dev)

  app.use(express.static(webDist, { index: false, maxAge: "1h" }));
  app.use((req, res, next) => {
    // Only GETs for non-API routes get the SPA shell; everything else falls through.
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(indexHtml);
  });
  logger.info("web_app_served", { webDist });
}
