import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { AnswerResult, ChildMissionState } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { startMission, answerStep, requestHint } from "@/lib/api";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState, CHILD_ERROR } from "@/components/ui/error-state";
import { MissionPlayerLayout } from "@/components/mission/MissionPlayerLayout";
import { MissionSidePanel } from "@/components/mission/MissionSidePanel";
import {
  StepActivity,
  canSubmit,
  initialResponse,
  stepMeta,
} from "@/components/mission/StepRenderer";

/** Best-effort description of the child's current attempt, for the hint prompt. */
function attemptText(content: unknown, value: Record<string, unknown>): string {
  if (typeof value.text === "string") return value.text;
  if (typeof value.optionId === "string") {
    const options = (content as { options?: { id: string; label: string }[] })?.options ?? [];
    return options.find((o) => o.id === value.optionId)?.label ?? "";
  }
  if (value.placements) return "made some matches";
  return "";
}

/** Full-viewport centered frame for loading / error states. */
function CenteredFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

/**
 * Desktop mission player. Starts/resumes the mission from backend data and
 * walks the child through its steps with the reusable StepActivity renderers.
 * The backend grades every answer and owns XP; this page renders state, relays
 * responses, and shows immediate feedback. No mission is hardcoded.
 */
export default function MissionDetailPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const { activeChild } = useChildContext();
  const child = activeChild!;
  const navigate = useNavigate();

  const [state, setState] = useState<ChildMissionState | null>(null);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<Record<string, unknown>>(initialResponse);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [xp, setXp] = useState(child.xp);
  const [level, setLevel] = useState(child.level);

  function load() {
    setError(false);
    setState(null);
    startMission(missionId!, child.id)
      .then((s) => {
        setState(s);
        const done = new Set(
          s.steps.filter((st) => st.status === "COMPLETED").map((st) => st.missionStepId),
        );
        const first = s.mission.steps.findIndex((st) => !done.has(st.id));
        setIndex(first === -1 ? 0 : first);
        setValue(initialResponse());
        setResult(null);
        track("mission_started", { childRef: child.id, missionSlug: s.mission.slug });
      })
      .catch(() => setError(true));
  }

  useEffect(load, [missionId, child.id]);

  // Fire challenge_started when a challenge step becomes current.
  const currentStep = state?.mission.steps[index];
  const currentSlug = state?.mission.slug;
  useEffect(() => {
    if (currentStep?.type === "CHALLENGE" && currentSlug) {
      track("challenge_started", { childRef: child.id, missionSlug: currentSlug });
    }
  }, [currentStep?.id, currentStep?.type, currentSlug, child.id]);

  if (error) {
    return (
      <CenteredFrame>
        <ErrorState
          title={CHILD_ERROR.title}
          description={CHILD_ERROR.description}
          onRetry={load}
        />
      </CenteredFrame>
    );
  }
  if (!state) {
    return (
      <CenteredFrame>
        <LoadingState label="Loading mission…" />
      </CenteredFrame>
    );
  }

  const steps = state.mission.steps;
  const step = steps[index]!;
  const meta = stepMeta(step);
  const isLast = index === steps.length - 1;
  const answered = result !== null;

  const doneStepIds = new Set<string>();
  steps.forEach((s, i) => i < index && doneStepIds.add(s.id));
  state.steps.forEach((st) => st.status === "COMPLETED" && doneStepIds.add(st.missionStepId));

  async function submit(response: Record<string, unknown>): Promise<AnswerResult | null> {
    setSubmitting(true);
    try {
      const res = await answerStep(missionId!, step.id, child.id, response);
      setXp(res.child.xp);
      setLevel(res.child.level);
      const missionSlug = state!.mission.slug;
      if (step.type === "CHALLENGE") {
        track("challenge_completed", { childRef: child.id, missionSlug });
      } else if (step.type !== "INTRO" && step.type !== "COMPLETION") {
        track("question_answered", {
          childRef: child.id,
          missionSlug,
          stepType: step.type,
          correct: res.correct,
        });
      }
      return res;
    } catch {
      setError(true);
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  function goToNext() {
    setResult(null);
    setValue(initialResponse());
    if (isLast) navigate(`/missions/${missionId}/complete`);
    else setIndex((i) => i + 1);
  }

  function goBack() {
    if (index === 0) return;
    setResult(null);
    setValue(initialResponse());
    setIndex((i) => i - 1);
  }

  // Continue behavior depends on step kind + whether it's been answered.
  async function handleContinue() {
    if (meta.kind === "acknowledge") {
      await submit(value); // records completion + XP, no feedback needed
      goToNext();
    } else if (!answered) {
      const res = await submit(value);
      if (res) setResult(res);
    } else {
      goToNext();
    }
  }

  const continueLabel =
    meta.kind === "acknowledge" || answered
      ? isLast
        ? "Finish mission"
        : "Continue"
      : meta.kind === "graded"
        ? "Check answer"
        : "Submit";

  const continueDisabled =
    submitting || (meta.kind !== "acknowledge" && !answered && !canSubmit(step, value));

  const footer = (
    <>
      <Button variant="outline" onClick={goBack} disabled={index === 0 || submitting}>
        <ArrowLeft className="size-4" /> Back
      </Button>
      {!isLast && (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Next: {stepMeta(steps[index + 1]!).eyebrow}
        </span>
      )}
      <Button variant="accent" size="lg" onClick={handleContinue} disabled={continueDisabled}>
        {submitting ? "Saving…" : continueLabel}
        {!submitting && <ArrowRight className="size-4" />}
      </Button>
    </>
  );

  return (
    <MissionPlayerLayout
      title={state.mission.title}
      stepIndex={index}
      stepCount={steps.length}
      xp={xp}
      level={level}
      onExit={() => navigate("/missions")}
      side={
        <MissionSidePanel
          concept={state.mission.concept}
          subtitle={state.mission.subtitle}
          steps={steps}
          currentStepId={step.id}
          doneStepIds={doneStepIds}
          hint={meta.hint}
          onShowHint={() =>
            track("hint_requested", {
              childRef: child.id,
              missionSlug: state.mission.slug,
              stepType: step.type,
            })
          }
          fetchHint={async () => {
            const content = (step.content ?? {}) as Record<string, unknown>;
            const question =
              [step.title, content.prompt ?? content.task].filter(Boolean).join(" — ") ||
              "the current step";
            const res = await requestHint({
              missionContext: state.mission.title,
              learningObjective: state.mission.concept,
              question,
              attempt: attemptText(step.content, value).slice(0, 500),
            });
            return res.hint;
          }}
        />
      }
      footer={footer}
    >
      {/* Keyed so each step's activity re-plays the entrance as the child advances. */}
      <div key={step.id} className="animate-rise-in">
        <StepActivity step={step} value={value} onChange={setValue} disabled={answered} result={result} />
      </div>
    </MissionPlayerLayout>
  );
}
