import { useState } from "react";
import type { ServedStep } from "@techquest/shared";
import { CheckCircle2, Circle, Dot, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { stepMeta } from "./StepRenderer";
import { TemplateSwitcher } from "./TemplateSwitcher";
import { splitConceptStages, conceptStageIndex } from "./ConceptRail";
import type { ChoiceTemplateId } from "./templates";

/**
 * Contextual side panel: the learning objective (What am I learning?), a
 * progress checklist, and a hint the child can reveal on demand. The hint is
 * generic guidance — never the answer.
 */
export function MissionSidePanel({
  concept,
  subtitle,
  steps,
  currentStepId,
  currentStepIndex,
  doneStepIds,
  hint,
  onShowHint,
  fetchHint,
  template,
  onTemplateChange,
  showTemplateSwitcher = false,
}: {
  concept: string;
  subtitle: string | null;
  steps: ServedStep[];
  currentStepId: string;
  /** Index of the current step, for lighting the concept-journey stage. */
  currentStepIndex: number;
  doneStepIds: Set<string>;
  hint: string;
  /** Called when the child reveals the hint (for analytics). */
  onShowHint?: () => void;
  /** Fetch a live AI hint; falls back to the static `hint` on failure. */
  fetchHint?: () => Promise<string>;
  /** Active choice template + setter (only meaningful on choice steps). */
  template?: ChoiceTemplateId;
  onTemplateChange?: (id: ChoiceTemplateId) => void;
  /** Show the "Switch template" control (true only on choice steps). */
  showTemplateSwitcher?: boolean;
}) {
  const stages = splitConceptStages(concept);
  const currentStage =
    stages.length > 1 ? conceptStageIndex(currentStepIndex, steps.length, stages.length) : 0;
  const [showHint, setShowHint] = useState(false);
  const [loadingHint, setLoadingHint] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);

  async function reveal() {
    setShowHint(true);
    onShowHint?.();
    if (!fetchHint) {
      setHintText(hint);
      return;
    }
    setLoadingHint(true);
    try {
      setHintText(await fetchHint());
    } catch {
      setHintText(hint); // graceful fallback to the built-in hint
    } finally {
      setLoadingHint(false);
    }
  }

  return (
    <div className="space-y-8 text-sm">
      <section className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What you're learning
        </h3>
        {stages.length > 1 ? (
          <ul className="space-y-1">
            {stages.map((stage, i) => (
              <li
                key={stage}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1 transition-colors",
                  i === currentStage
                    ? "bg-primary/10 font-semibold text-foreground"
                    : i < currentStage
                      ? "text-success"
                      : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    i === currentStage
                      ? "bg-primary text-primary-foreground"
                      : i < currentStage
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {i < currentStage ? <CheckCircle2 className="size-3.5" /> : i + 1}
                </span>
                {stage}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-semibold">{concept}</p>
        )}
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </section>

      {showTemplateSwitcher && template && onTemplateChange && (
        <TemplateSwitcher value={template} onChange={onTemplateChange} />
      )}

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your progress
        </h3>
        <ul className="space-y-1.5">
          {steps.map((s) => {
            const done = doneStepIds.has(s.id);
            const current = s.id === currentStepId;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-2",
                  current ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                ) : current ? (
                  <Dot className="size-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="size-4 shrink-0 opacity-40" />
                )}
                <span className="truncate">{s.title ?? stepMeta(s).eyebrow}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Stuck?
        </h3>
        {showHint ? (
          <p className="flex items-start gap-2 rounded-md bg-secondary p-3 text-secondary-foreground">
            <Lightbulb className="size-4 shrink-0 text-primary" />
            {loadingHint ? "Thinking of a hint…" : (hintText ?? hint)}
          </p>
        ) : (
          <Button variant="outline" size="sm" onClick={reveal}>
            <Lightbulb className="size-4" /> Show a hint
          </Button>
        )}
      </section>
    </div>
  );
}
