/**
 * Pure mission-content validation (no I/O, no process exit) so it can be reused
 * and tested. Returns a list of human-readable problems; empty means valid.
 */
import type { SeedMission, SeedStep } from "../prisma/content.js";

const VALID_STEP_TYPES = [
  "INTRO",
  "QUESTION",
  "CHOICE",
  "DRAG_DROP",
  "PREDICTION",
  "CHALLENGE",
  "REFLECTION",
  "COMPLETION",
] as const;

const GRADED = new Set(["CHOICE", "PREDICTION", "DRAG_DROP"]);
const INTERACTIVE = new Set(["CHOICE", "PREDICTION", "DRAG_DROP", "CHALLENGE", "QUESTION"]);

const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isArr = (v: unknown): v is unknown[] => Array.isArray(v);
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

type Option = { id?: unknown; label?: unknown; correct?: unknown };

function validateStep(errors: string[], where: string, step: SeedStep): void {
  const add = (msg: string) => errors.push(`${where}: ${msg}`);

  // step type
  if (!VALID_STEP_TYPES.includes(step.type as (typeof VALID_STEP_TYPES)[number])) {
    add(`invalid step type "${String(step.type)}"`);
    return;
  }
  // title
  if (!isStr(step.title)) add("step is missing a title");
  // XP
  if (step.xpReward !== undefined && (!Number.isInteger(step.xpReward) || step.xpReward < 0)) {
    add(`xpReward must be a non-negative integer (got ${String(step.xpReward)})`);
  }

  const c = step.content;
  if (!isObj(c)) {
    add("step content must be an object");
    return;
  }

  switch (step.type) {
    case "INTRO":
    case "COMPLETION": {
      if (!isStr(c.heading)) add("prose step needs a non-empty heading");
      if (!isStr(c.body)) add("prose step needs a non-empty body");
      break;
    }
    case "CHOICE":
    case "PREDICTION": {
      if (!isStr(c.prompt)) add("choice/prediction step needs a prompt (question)");
      const options = isArr(c.options) ? (c.options as Option[]) : null;
      if (!options || options.length < 2) {
        add("needs at least two answer options");
        break;
      }
      const ids = new Set<string>();
      let correctCount = 0;
      options.forEach((o, i) => {
        if (!isStr(o.id)) add(`option ${i} is missing an id`);
        else if (ids.has(o.id)) add(`duplicate option id "${o.id}"`);
        else ids.add(o.id);
        if (!isStr(o.label)) add(`option ${i} is missing a label`);
        if (typeof o.correct !== "boolean") add(`option ${i} needs a boolean "correct"`);
        if (o.correct === true) correctCount += 1;
      });
      if (correctCount < 1) add("needs at least one correct option");
      break;
    }
    case "DRAG_DROP": {
      if (!isStr(c.prompt)) add("drag-drop step needs a prompt");
      const items = isArr(c.items) ? (c.items as { id?: unknown }[]) : null;
      const targets = isArr(c.targets) ? (c.targets as { id?: unknown }[]) : null;
      if (!items || items.length < 2) add("drag-drop needs at least two items");
      if (!targets || targets.length < 2) add("drag-drop needs at least two targets");
      const solution = isObj(c.solution) ? c.solution : null;
      if (!solution) {
        add("drag-drop needs a solution map");
        break;
      }
      const itemIds = new Set((items ?? []).map((it) => String(it.id)));
      const targetIds = new Set((targets ?? []).map((t) => String(t.id)));
      for (const id of itemIds) {
        if (!(id in solution)) add(`solution is missing item "${id}"`);
      }
      for (const [item, target] of Object.entries(solution)) {
        if (!itemIds.has(item)) add(`solution references unknown item "${item}"`);
        if (!targetIds.has(String(target))) add(`solution maps to unknown target "${String(target)}"`);
      }
      break;
    }
    case "QUESTION":
    case "REFLECTION": {
      if (!isStr(c.prompt)) add(`${step.type.toLowerCase()} step needs a prompt`);
      break;
    }
    case "CHALLENGE": {
      if (!isStr(c.task)) add("challenge step needs a task");
      break;
    }
  }
}

function validateMission(errors: string[], m: SeedMission, mi: number): void {
  const where = `mission[${mi}] "${m.slug ?? "?"}"`;
  const add = (msg: string) => errors.push(`${where}: ${msg}`);

  // title / description / objective
  if (!isStr(m.title)) add("missing title");
  if (!isStr(m.subtitle)) add("missing subtitle");
  if (!isStr(m.description)) add("missing description");
  if (!isStr(m.concept)) add("missing concept (learning objective)");
  if (!isStr(m.slug)) add("missing slug");
  if (!Number.isInteger(m.order) || m.order < 1) add("order must be a positive integer");
  if (!Number.isInteger(m.estimatedMinutes) || m.estimatedMinutes < 1)
    add("estimatedMinutes must be a positive integer");

  const steps = isArr(m.steps) ? (m.steps as SeedStep[]) : null;
  if (!steps || steps.length === 0) {
    add("must have at least one step");
    return;
  }

  steps.forEach((s, i) => validateStep(errors, `${where} step[${i}] (${String(s.type)})`, s));

  // step ordering + required completion step
  const completions = steps.filter((s) => s.type === "COMPLETION");
  if (completions.length !== 1)
    add(`must have exactly one COMPLETION step (found ${completions.length})`);
  if (steps[steps.length - 1]?.type !== "COMPLETION")
    add("the last step must be the COMPLETION step");
  const intros = steps.filter((s) => s.type === "INTRO");
  if (intros.length > 1) add("must not have more than one INTRO step");
  if (intros.length === 1 && steps[0]?.type !== "INTRO") add("the INTRO step must be first");

  // interactive learning (and therefore step-level XP to earn)
  if (steps.filter((s) => INTERACTIVE.has(s.type)).length < 1)
    add("must include at least one interactive step");
  if (steps.filter((s) => GRADED.has(s.type)).length < 1)
    add("must include at least one graded step (choice/prediction/drag-drop)");
}

/** Validate all mission + badge content. Returns problems (empty = valid). */
export function validateContent(
  missions: SeedMission[],
  badges: { slug: string }[],
): string[] {
  const errors: string[] = [];

  missions.forEach((m, i) => validateMission(errors, m, i));

  // mission uniqueness
  const dupe = (label: string, values: unknown[]) => {
    const seen = new Set<unknown>();
    for (const v of values) {
      if (seen.has(v)) errors.push(`content: duplicate mission ${label} "${String(v)}"`);
      seen.add(v);
    }
  };
  dupe("slug", missions.map((m) => m.slug));
  dupe("order", missions.map((m) => m.order));
  dupe("title", missions.map((m) => m.title));

  // badge uniqueness
  const badgeSlugs = new Set<string>();
  for (const b of badges) {
    if (badgeSlugs.has(b.slug)) errors.push(`badges: duplicate badge slug "${b.slug}"`);
    badgeSlugs.add(b.slug);
  }

  return errors;
}
