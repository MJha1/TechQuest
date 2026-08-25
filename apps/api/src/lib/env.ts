import { z } from "zod";

/**
 * Validated environment configuration. Parsed once at startup; invalid config
 * fails fast rather than surfacing as a confusing runtime error later.
 */
/**
 * Dev/test fallback for the Better Auth signing secret. NEVER used in
 * production — the refine below hard-fails production startup unless a real
 * secret is provided via the environment. This keeps local dev and the test
 * suite runnable without secrets while guaranteeing prod is explicit.
 */
const DEV_AUTH_SECRET = "dev-insecure-change-me-in-production";

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    // Comma-separated list of allowed browser origins for CORS.
    CORS_ORIGINS: z.string().default("http://localhost:5173"),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    // Max request body size (any value the body-parser understands, e.g. "32kb").
    BODY_LIMIT: z.string().default("32kb"),
    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error", "silent"])
      .default("info"),
    // Better Auth: secret is server-only and MUST never reach the frontend.
    BETTER_AUTH_SECRET: z.string().min(1).default(DEV_AUTH_SECRET),
    // Public base URL Better Auth uses to build callback/cookie URLs.
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),
    // AI (server-only). The key never reaches the browser. When unset, hints use
    // the safe fallback. Model is overridable (e.g. claude-haiku-4-5 for cost).
    ANTHROPIC_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default("claude-opus-5"),
    AI_HINT_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
    // Absolute path to the built React app to serve in production. Empty (the
    // default) falls back to the sibling apps/web/dist next to the API build, and
    // if that doesn't exist static serving is simply skipped (e.g. in dev, where
    // Vite serves the frontend).
    WEB_DIST: z.string().default(""),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV === "production" && cfg.BETTER_AUTH_SECRET === DEV_AUTH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["BETTER_AUTH_SECRET"],
        message: "BETTER_AUTH_SECRET must be set to a strong value in production.",
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

export const corsOrigins: string[] = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
