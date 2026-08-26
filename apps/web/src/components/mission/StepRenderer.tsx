import { useState } from "react";
import type { ServedStep, AnswerResult, MissionStepType } from "@techquest/shared";
import { CheckCircle2, XCircle, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable, data-driven mission-step renderers.
 *
 * `StepActivity` is a *controlled* component: the mission player owns the
 * response value and the Back/Continue controls; each renderer only draws the
 * activity for its `step.type` and shows immediate feedback. Dispatch is purely
 * on type — no individual mission is hardcoded. Content arrives sanitized
 * (answer keys stripped), so the client cannot self-grade.
 */

// Client-facing (sanitized) content shapes — no `correct`/`solution` present.
// `emoji` is an optional visual sugar the seed content may supply.
interface Prose { heading?: string; body?: string; emoji?: string }
interface Option { id: string; label: string; emoji?: string }
interface ChoiceContent { prompt: string; options: Option[] }
interface DragContent { prompt: string; items: Option[]; targets: Option[] }
interface TextContent { prompt?: string; task?: string; placeholder?: string }

const ACKNOWLEDGE: MissionStepType[] = ["INTRO", "COMPLETION"];
const GRADED: MissionStepType[] = ["CHOICE", "PREDICTION", "DRAG_DROP"];

export type StepKind = "acknowledge" | "graded" | "open";

export interface StepMeta {
  kind: StepKind;
  /** "What am I learning?" eyebrow shown above the activity. */
  eyebrow: string;
  /** A gentle, non-answer hint for the side panel. */
  hint: string;
}

/** Per-type framing so every screen answers learn / do / next consistently. */
export function stepMeta(step: ServedStep): StepMeta {
  const kind: StepKind = ACKNOWLEDGE.includes(step.type)
    ? "acknowledge"
    : GRADED.includes(step.type)
      ? "graded"
      : "open";

  const byType: Record<MissionStepType, { eyebrow: string; hint: string }> = {
    INTRO: { eyebrow: "The big idea", hint: "Read this, then press Continue." },
    QUESTION: { eyebrow: "Show what you know", hint: "A sentence or two is plenty." },
    CHOICE: { eyebrow: "Make a choice", hint: "Pick the option that matches what you just learned." },
    DRAG_DROP: { eyebrow: "Sort it out", hint: "Match each item to the group it belongs to." },
    PREDICTION: { eyebrow: "Predict it", hint: "Use the pattern to guess what happens next." },
    CHALLENGE: { eyebrow: "Try it yourself", hint: "There's no single right answer — give it a go." },
    REFLECTION: { eyebrow: "Think it over", hint: "Share what you think — anything thoughtful counts." },
    COMPLETION: { eyebrow: "Mission complete", hint: "Press Finish to collect your XP." },
  };
  return { kind, ...byType[step.type] };
}

/** Empty starting response. */
export function initialResponse(): Record<string, unknown> {
  return {};
}

/** Whether the current response is complete enough to submit. */
export function canSubmit(step: ServedStep, response: Record<string, unknown>): boolean {
  switch (step.type) {
    case "INTRO":
    case "COMPLETION":
      return true;
    case "CHOICE":
    case "PREDICTION":
      return typeof response.optionId === "string";
    case "DRAG_DROP": {
      const c = step.content as DragContent;
      const placements = (response.placements as Record<string, string>) ?? {};
      return c.items.length > 0 && c.items.every((it) => placements[it.id]);
    }
    default: // QUESTION / CHALLENGE / REFLECTION
      return typeof response.text === "string" && response.text.trim().length > 0;
  }
}

export interface StepActivityProps {
  step: ServedStep;
  value: Record<string, unknown>;
  onChange: (r: Record<string, unknown>) => void;
  /** Freeze inputs once the step has been answered. */
  disabled: boolean;
  /** Grading result for immediate feedback (null before answering). */
  result: AnswerResult | null;
}

/** The center "current learning activity". Renders content, inputs, feedback. */
export function StepActivity({ step, value, onChange, disabled, result }: StepActivityProps) {
  const meta = stepMeta(step);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{meta.eyebrow}</p>
        {step.title && (
          <h2 className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {step.title}
          </h2>
        )}
      </div>

      <StepBody step={step} response={value} onChange={onChange} disabled={disabled} />

      {result && <Feedback result={result} />}
    </div>
  );
}

/** Immediate feedback banner. Correct/positive results pop in; a wrong answer
 *  gets a gentle shake — encouraging, never harsh. Both respect reduced motion. */
function Feedback({ result }: { result: AnswerResult }) {
  if (result.correct === null) {
    return (
      <div
        role="status"
        className="flex animate-pop items-start gap-2 rounded-md bg-secondary p-3 text-sm text-secondary-foreground"
      >
        <Sparkles className="size-5 shrink-0 animate-pop text-primary" />
        <p className="font-semibold">
          Nice thinking!{result.xpAwarded > 0 ? ` +${result.xpAwarded} XP` : ""}
        </p>
      </div>
    );
  }
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-md p-3 text-sm",
        result.correct ? "animate-pop bg-success/10 text-success" : "animate-shake bg-destructive/10 text-destructive",
      )}
    >
      {result.correct ? <CheckCircle2 className="size-5 shrink-0" /> : <XCircle className="size-5 shrink-0" />}
      <div>
        <p className="font-semibold">{result.correct ? "Correct!" : "Not quite — keep going!"}</p>
        {result.feedback && <p className="mt-0.5 text-foreground/80">{result.feedback}</p>}
      </div>
    </div>
  );
}

/** Renders the input controls for a step type. Data-driven — one branch each. */
function StepBody({
  step,
  response,
  onChange,
  disabled,
}: {
  step: ServedStep;
  response: Record<string, unknown>;
  onChange: (r: Record<string, unknown>) => void;
  disabled: boolean;
}) {
  switch (step.type) {
    case "INTRO":
    case "COMPLETION": {
      const c = step.content as Prose;
      const emoji = c.emoji ?? (step.type === "COMPLETION" ? "🎉" : "🤖");
      return (
        <div className="space-y-4 text-center">
          <div
            className="mx-auto flex size-24 animate-float items-center justify-center rounded-3xl text-6xl shadow-sm"
            style={{ backgroundImage: "var(--gradient-brand)" }}
            aria-hidden
          >
            <span>{emoji}</span>
          </div>
          {c.heading && (
            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {c.heading}
            </p>
          )}
          {c.body && <p className="mx-auto max-w-prose text-muted-foreground">{c.body}</p>}
        </div>
      );
    }

    case "CHOICE":
    case "PREDICTION": {
      const c = step.content as ChoiceContent;
      const selected = response.optionId as string | undefined;
      return (
        <fieldset className="space-y-3" disabled={disabled}>
          <legend className="mb-3 text-base font-semibold">{c.prompt}</legend>
          <div className="flex flex-col gap-3">
            {c.options.map((opt, i) => {
              const isSel = selected === opt.id;
              return (
                <label
                  key={opt.id}
                  className={cn(
                    "group flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-150",
                    "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:scale-[0.99]",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    isSel ? "border-primary bg-primary/10 shadow-sm" : "border-border",
                  )}
                >
                  <input
                    type="radio"
                    name={`step-${step.id}`}
                    value={opt.id}
                    checked={isSel}
                    onChange={() => onChange({ optionId: opt.id })}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl transition-transform duration-200 group-hover:scale-110",
                      !opt.emoji && "font-bold text-primary",
                      isSel && "scale-110",
                    )}
                    aria-hidden
                  >
                    {opt.emoji ?? String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 text-sm font-medium sm:text-base">{opt.label}</span>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
                      isSel ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                    )}
                    aria-hidden
                  >
                    {isSel && <Check className="size-4" />}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      );
    }

    case "DRAG_DROP":
      return (
        <DragDropActivity step={step} response={response} onChange={onChange} disabled={disabled} />
      );

    default: {
      // QUESTION / CHALLENGE / REFLECTION — open-ended text.
      const c = step.content as TextContent;
      return (
        <div className="space-y-3">
          <label htmlFor={`text-${step.id}`} className="flex items-center gap-2 font-medium">
            <span className="text-xl" aria-hidden>✍️</span>
            {c.prompt ?? c.task}
          </label>
          <textarea
            id={`text-${step.id}`}
            disabled={disabled}
            rows={4}
            placeholder={c.placeholder}
            value={(response.text as string) ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            className="w-full rounded-xl border-2 border-border bg-background p-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      );
    }
  }
}

/**
 * Interactive sort-into-groups activity. Tap an item then tap a group to place
 * it (touch/keyboard friendly), or drag it with a mouse. Controlled: placements
 * live in the response as `{ placements: { [itemId]: targetId } }`.
 */
function DragDropActivity({
  step,
  response,
  onChange,
  disabled,
}: {
  step: ServedStep;
  response: Record<string, unknown>;
  onChange: (r: Record<string, unknown>) => void;
  disabled: boolean;
}) {
  const c = step.content as DragContent;
  const placements = (response.placements as Record<string, string>) ?? {};
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const chip =
    "rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-all duration-150 hover:-translate-y-0.5 active:scale-95 disabled:opacity-60";

  function place(itemId: string, targetId: string) {
    if (disabled) return;
    onChange({ placements: { ...placements, [itemId]: targetId } });
    setSelectedItem(null);
    setDragOver(null);
  }
  function unplace(itemId: string) {
    if (disabled) return;
    const next = { ...placements };
    delete next[itemId];
    onChange({ placements: next });
  }

  const unplaced = c.items.filter((it) => !placements[it.id]);
  const itemsIn = (targetId: string) => c.items.filter((it) => placements[it.id] === targetId);

  return (
    <div className="space-y-4">
      <p className="text-base font-semibold">{c.prompt}</p>

      {/* Tray of unplaced items */}
      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {unplaced.length > 0 ? "Tap an item, then tap a group — or drag it." : "All placed! 🎉"}
        </p>
        <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2">
          {unplaced.map((it) => (
            <button
              key={it.id}
              type="button"
              disabled={disabled}
              draggable={!disabled}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", it.id)}
              onClick={() => setSelectedItem((cur) => (cur === it.id ? null : it.id))}
              className={cn(chip, selectedItem === it.id && "border-primary ring-2 ring-ring")}
            >
              {it.label}
            </button>
          ))}
          {unplaced.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
        </div>
      </div>

      {/* Target groups */}
      <div className="grid gap-3 sm:grid-cols-2">
        {c.targets.map((t) => (
          <div
            key={t.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(t.id);
            }}
            onDragLeave={() => setDragOver((cur) => (cur === t.id ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) place(id, t.id);
            }}
            onClick={() => selectedItem && place(selectedItem, t.id)}
            className={cn(
              "min-h-[5.5rem] rounded-xl border-2 p-3 transition-all duration-150",
              dragOver === t.id
                ? "border-primary bg-primary/10"
                : selectedItem
                  ? "cursor-pointer border-primary/40 hover:bg-primary/5"
                  : "border-border",
            )}
          >
            <p className="mb-2 text-sm font-semibold">{t.label}</p>
            <div className="flex flex-wrap gap-2">
              {itemsIn(t.id).map((it) => (
                <button
                  key={it.id}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    unplace(it.id);
                  }}
                  className={cn(chip, "animate-pop border-primary/40 bg-primary/10")}
                  title="Tap to remove"
                >
                  {it.label}
                </button>
              ))}
              {itemsIn(t.id).length === 0 && (
                <span className="text-xs text-muted-foreground">Drop items here</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
