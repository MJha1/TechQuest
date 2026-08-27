import { Fragment } from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Split a mission concept like "Examples → Patterns → Prediction" into its
 *  stages. Missions with a single-word concept return one stage (no journey). */
export function splitConceptStages(concept: string): string[] {
  return concept
    .split(/→|->|—>|›|»/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Which stage the child is in, from how far through the steps they are. */
export function conceptStageIndex(
  stepIndex: number,
  stepCount: number,
  stageCount: number,
): number {
  if (stageCount <= 1 || stepCount <= 0) return 0;
  const idx = Math.floor(stepIndex / (stepCount / stageCount));
  return Math.max(0, Math.min(stageCount - 1, idx));
}

/**
 * The AI-concept journey rail. Turns the mission's concept into a horizontal
 * stepper that lights up as the child advances — keeping the big idea
 * (e.g. Examples → Patterns → Prediction) front and center on every step.
 * Renders nothing for single-stage concepts.
 */
export function ConceptRail({
  concept,
  stepIndex,
  stepCount,
}: {
  concept: string;
  stepIndex: number;
  stepCount: number;
}) {
  const stages = splitConceptStages(concept);
  if (stages.length < 2) return null;
  const current = conceptStageIndex(stepIndex, stepCount, stages.length);

  return (
    <div className="mb-6" aria-label={`Concept journey: ${concept}`}>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {stages.map((stage, i) => {
          const done = i < current;
          const isCurrent = i === current;
          return (
            <Fragment key={stage}>
              {i > 0 && (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
              )}
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition-colors duration-200",
                  done && "border-success/40 bg-success/10 text-success",
                  isCurrent && "border-primary bg-primary/10 text-foreground shadow-sm",
                  !done && !isCurrent && "border-border text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-xs",
                    done && "bg-success text-success-foreground",
                    isCurrent && "bg-primary text-primary-foreground animate-pop",
                    !done && !isCurrent && "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {done ? <Check className="size-3" /> : i + 1}
                </span>
                {stage}
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
