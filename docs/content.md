# Mission Content

All mission and badge content lives in **`packages/db/prisma/content.ts`** — a
plain data module with no side effects. It is the single source of truth,
imported by both:

- the **seed runner** (`packages/db/prisma/seed.ts`), which writes it to the DB, and
- the **validator** (`packages/db/scripts/validate-content.ts`), run via
  `npm run validate:content`.

Content is deliberately kept **out of React components** — the frontend renders
whatever the API serves from the database, driven purely by each step's `type`.

## Validating content

```bash
npm run validate:content
```

This runs offline (no database needed) and **exits non-zero if content is
invalid**, so it can gate CI and pre-seed checks. It validates:

- **title / subtitle / description / objective** (`concept`) — present & non-empty
- **step ordering** — one `INTRO` first (if present), exactly one `COMPLETION` last
- **step type** — every `type` is a valid `MissionStepType`
- **questions** — interactive steps have a `prompt` / `task`
- **answer options** — choice/prediction have ≥2 options, each `{ id, label, correct }`, ids unique
- **correct answers** — ≥1 correct option; drag-drop `solution` covers every item and maps to real targets
- **XP** — `xpReward` is a non-negative integer; each mission has ≥1 graded step
- **mission uniqueness** — `slug`, `order`, and `title` are unique across missions (badge slugs too)
- **required completion step** — every mission ends with a `COMPLETION` step

## The shape

```ts
type SeedMission = {
  slug: string;          // unique, kebab-case, stable (used in URLs/analytics)
  title: string;         // unique
  subtitle: string;
  concept: string;       // the ONE learning objective
  description: string;
  order: number;         // unique, positive
  estimatedMinutes: number; // aim for 5–10
  steps: SeedStep[];
};

type SeedStep = {
  type: MissionStepType; // INTRO | QUESTION | CHOICE | DRAG_DROP | PREDICTION | CHALLENGE | REFLECTION | COMPLETION
  title: string;
  content: Record<string, unknown>; // shape depends on `type` (below)
  xpReward?: number;     // optional; defaults to 10
};
```

### Step content by type

| Type | `content` fields | Graded? |
|---|---|---|
| `INTRO` | `heading`, `body` | no |
| `CHOICE` / `PREDICTION` | `prompt`, `options: [{ id, label, correct }]`, `explanation`/`reveal` (immediate feedback) | yes |
| `DRAG_DROP` | `prompt`, `items: [{ id, label }]`, `targets: [{ id, label }]`, `solution: { itemId: targetId }`, `explanation` | yes |
| `QUESTION` | `prompt`, `sampleAnswer` | no |
| `CHALLENGE` | `task`, `successCriteria`, `placeholder` | no (but awards XP) |
| `REFLECTION` | `prompt`, `placeholder` | no |
| `COMPLETION` | `heading`, `body`, `parentSummary`, `homePrompt` | no |

> **Answer keys** (`correct`, `solution`, `explanation`, `reveal`, `sampleAnswer`)
> are stripped server-side before content reaches the browser — the backend
> grades answers. Put the real answers here; they never leak to the child.
>
> **`parentSummary` / `homePrompt`** on the `COMPLETION` step power the parent
> dashboard's "What your child learned" and "Try this at home" sections.

## Adding a new mission

1. **Edit `packages/db/prisma/content.ts`.** Add a `SeedMission` to the `missions`
   array with a **unique** `slug`, `order`, and `title`.
2. **Structure the steps** (6–10, ~5–10 min):
   `INTRO` → a few interactive steps (`CHOICE` / `PREDICTION` / `DRAG_DROP` — each
   with an `explanation`/`reveal` for immediate feedback) → a `CHALLENGE` →
   a `REFLECTION` → a `COMPLETION` (with `parentSummary` + `homePrompt`).
   Include at least one **graded** step so XP can be earned.
3. **Validate:** `npm run validate:content` — fix anything it reports.
4. **Seed:** `npm run seed -w @techquest/db` (idempotent; upserts by slug and
   rebuilds steps). Requires `DATABASE_URL` in `packages/db/.env`.
5. If the mission should grant a **badge**, add a rule in
   `apps/api/src/lib/gamification.ts` and a badge entry in `content.ts`.

No frontend changes are needed — the mission renders automatically from its
step types.
