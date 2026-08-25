/**
 * @techquest/shared — the single source of truth for cross-cutting contracts.
 *
 * Both the Express API and the React web app import types and Zod schemas from
 * here, so request/response shapes are defined exactly once.
 */

export const APP_NAME = "TechQuest" as const;

export * from "./json.js";
export * from "./enums.js";
export * from "./domain.js";
export * from "./commands.js";
export * from "./engine.js";
export * from "./parent.js";
export * from "./recommendation.js";
export * from "./ai.js";
export * from "./api.js";
