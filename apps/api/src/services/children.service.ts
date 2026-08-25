import { prisma } from "@techquest/db";
import type { Child as DbChild } from "@techquest/db";
import type { Child, CreateChildInput, UpdateChildInput } from "@techquest/shared";

/**
 * Child (learner profile) persistence. Every read/write is scoped by
 * `parentId`, so the data layer itself refuses cross-parent access even if a
 * route guard were ever missed — defense in depth behind `requireChildOwnership`.
 *
 * Children are profiles, not accounts: only the minimal, non-identifying fields
 * are stored (nickname, age band, avatar). Progression fields (level/xp/streak)
 * are server-owned and never accepted from the client.
 */

/** Map a Prisma row to the shared wire shape (Date → ISO-8601 strings). */
function toWire(c: DbChild): Child {
  return {
    id: c.id,
    parentId: c.parentId,
    nickname: c.nickname,
    ageBand: c.ageBand as Child["ageBand"],
    avatar: c.avatar,
    level: c.level,
    xp: c.xp,
    streak: c.streak,
    longestStreak: c.longestStreak,
    lastActiveAt: c.lastActiveAt ? c.lastActiveAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/** All children belonging to the given parent, oldest first. */
export async function listChildrenForParent(parentId: string): Promise<Child[]> {
  const rows = await prisma.child.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toWire);
}

/** Create a child under the given parent. Progression fields use DB defaults. */
export async function createChildForParent(
  parentId: string,
  input: CreateChildInput,
): Promise<Child> {
  const row = await prisma.child.create({
    data: {
      parentId,
      nickname: input.nickname,
      ageBand: input.ageBand,
      avatar: input.avatar ?? null,
    },
  });
  return toWire(row);
}

/** Fetch a single child, scoped to the parent. Null if not found/not owned. */
export async function getChildForParent(
  parentId: string,
  id: string,
): Promise<Child | null> {
  const row = await prisma.child.findFirst({ where: { id, parentId } });
  return row ? toWire(row) : null;
}

/** Update a child, scoped to the parent. Null if not found/not owned. */
export async function updateChildForParent(
  parentId: string,
  id: string,
  input: UpdateChildInput,
): Promise<Child | null> {
  // Scope the write by parentId so it is a no-op on someone else's child.
  const result = await prisma.child.updateMany({
    where: { id, parentId },
    data: input,
  });
  if (result.count === 0) return null;
  return getChildForParent(parentId, id);
}
