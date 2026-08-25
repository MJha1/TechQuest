import express, { type Express, type RequestHandler } from "express";
import { env } from "./lib/env.js";
import type { SessionResolver } from "./lib/auth.js";
import { authNodeHandler, createBetterAuthSessionResolver } from "./lib/better-auth.js";
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

  // Fallbacks
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
