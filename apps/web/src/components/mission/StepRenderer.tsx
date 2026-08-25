import type { ServedStep, AnswerResult, MissionStepType } from "@techquest/shared";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";
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
interface Prose { heading?: string; body?: string }
interface Option { id: string; label: string }
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

/** Immediate feedback banner. */
function Feedback({ result }: { result: AnswerResult }) {
  if (result.correct === null) {
    return (
      <div role="status" className="flex items-start gap-2 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">
        <Sparkles className="size-5 shrink-0 text-primary" />
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
        result.correct ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
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
      return (
        <div className="space-y-2">
          {c.heading && <p className="text-lg font-semibold">{c.heading}</p>}
          {c.body && <p className="text-muted-foreground">{c.body}</p>}
        </div>
      );
    }

    case "CHOICE":
    case "PREDICTION": {
      const c = step.content as ChoiceContent;
      const selected = response.optionId as string | undefined;
      return (
        <fieldset className="space-y-3" disabled={disabled}>
          <legend className="mb-2 font-medium">{c.prompt}</legend>
          {c.options.map((opt) => (
            <label
              key={opt.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
                selected === opt.id ? "border-primary ring-2 ring-ring" : "border-border hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name={`step-${step.id}`}
                value={opt.id}
                checked={selected === opt.id}
                onChange={() => onChange({ optionId: opt.id })}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </fieldset>
      );
    }

    case "DRAG_DROP": {
      const c = step.content as DragContent;
      const placements = (response.placements as Record<string, string>) ?? {};
      return (
        <div className="space-y-3">
          <p className="font-medium">{c.prompt}</p>
          {c.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="flex-1 rounded-md border border-border p-2 text-sm">{item.label}</span>
              <select
                aria-label={`Group for ${item.label}`}
                disabled={disabled}
                value={placements[item.id] ?? ""}
                onChange={(e) => onChange({ placements: { ...placements, [item.id]: e.target.value } })}
                className="rounded-md border border-border bg-background p-2 text-sm"
              >
                <option value="" disabled>Choose…</option>
                {c.targets.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }

    default: {
      // QUESTION / CHALLENGE / REFLECTION — open-ended text.
      const c = step.content as TextContent;
      return (
        <div className="space-y-2">
          <label htmlFor={`text-${step.id}`} className="font-medium">
            {c.prompt ?? c.task}
          </label>
          <textarea
            id={`text-${step.id}`}
            disabled={disabled}
            rows={3}
            placeholder={c.placeholder}
            value={(response.text as string) ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>
      );
    }
  }
}
