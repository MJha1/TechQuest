import { env } from "./env.js";

/**
 * Minimal structured (JSON) logger — no runtime dependency. Emits one JSON line
 * per event so logs are machine-parseable in Railway/aggregators.
 */
type Level = "debug" | "info" | "warn" | "error";

const WEIGHT: Record<Level | "silent", number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
};

function emit(level: Level, msg: string, meta?: Record<string, unknown>): void {
  if (env.LOG_LEVEL === "silent") return;
  if (WEIGHT[level] < WEIGHT[env.LOG_LEVEL]) return;
  const line = JSON.stringify({
    level,
    msg,
    time: new Date().toISOString(),
    ...meta,
  });
  // eslint-disable-next-line no-console
  (level === "error" ? console.error : console.log)(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
