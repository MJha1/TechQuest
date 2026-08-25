import type { Request, Response } from "express";
import { ok } from "@techquest/shared";
import type { CreateChildInput, UpdateChildInput } from "@techquest/shared";
import { notFound } from "../lib/http-error.js";
import {
  createChildForParent,
  getChildForParent,
  listChildrenForParent,
  updateChildForParent,
} from "../services/children.service.js";

/**
 * Child onboarding controllers. Thin by design: auth/ownership are enforced by
 * middleware (`requireAuth`, `requireChildOwnership`) and validation by
 * `validate`, so these just call the service and shape the response envelope.
 * `req.auth` is guaranteed present (routes sit behind `requireAuth`).
 */

/** GET /api/children — the authenticated parent's own children. */
export async function listChildren(req: Request, res: Response): Promise<void> {
  const children = await listChildrenForParent(req.auth!.userId);
  res.json(ok(children));
}

/** POST /api/children — create a child under the authenticated parent. */
export async function createChild(req: Request, res: Response): Promise<void> {
  const input = req.validated.body as CreateChildInput;
  const child = await createChildForParent(req.auth!.userId, input);
  res.status(201).json(ok(child));
}

/** GET /api/children/:id — ownership already verified by requireChildOwnership. */
export async function getChild(req: Request, res: Response): Promise<void> {
  const child = await getChildForParent(req.auth!.userId, req.child!.id);
  if (!child) throw notFound("Child not found");
  res.json(ok(child));
}

/** PATCH /api/children/:id — ownership already verified by requireChildOwnership. */
export async function updateChild(req: Request, res: Response): Promise<void> {
  const input = req.validated.body as UpdateChildInput;
  const child = await updateChildForParent(req.auth!.userId, req.child!.id, input);
  if (!child) throw notFound("Child not found");
  res.json(ok(child));
}
