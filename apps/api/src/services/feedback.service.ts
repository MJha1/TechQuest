import { prisma } from "@techquest/db";
import type { ParentFeedbackInput, ParentFeedbackResult } from "@techquest/shared";

/**
 * Parent product feedback. Stores only the rating, an optional comment, the
 * parent id (from the session), and a timestamp — no extra personal data.
 */
export async function createParentFeedback(
  parentId: string,
  input: ParentFeedbackInput,
): Promise<ParentFeedbackResult> {
  const row = await prisma.parentFeedback.create({
    data: {
      parentId,
      rating: input.rating,
      comment: input.comment?.trim() ? input.comment.trim() : null,
    },
  });
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
  };
}
