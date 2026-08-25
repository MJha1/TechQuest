import { PrismaClient } from "@prisma/client";

/**
 * Shared Prisma client singleton.
 *
 * The API imports `prisma` from this package rather than instantiating its own,
 * keeping a single connection pool. Re-exports the generated types so callers
 * get model types from one place.
 */
export const prisma = new PrismaClient();

export { PrismaClient };
export type * from "@prisma/client";
