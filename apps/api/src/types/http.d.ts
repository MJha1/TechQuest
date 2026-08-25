import type { AuthUser } from "../lib/auth.js";

/**
 * Request augmentations added by TechQuest middleware.
 * - `id`:        per-request correlation id (request-id middleware)
 * - `auth`:      resolved session, or null (authenticate middleware)
 * - `child`:     child verified to belong to req.auth (requireChildOwnership)
 * - `validated`: Zod-parsed inputs (validate middleware) — kept separate from
 *                req.query/params, which are read-only getters in Express 5.
 */
declare global {
  namespace Express {
    interface Request {
      id: string;
      auth: AuthUser | null;
      child?: { id: string; parentId: string };
      validated: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
