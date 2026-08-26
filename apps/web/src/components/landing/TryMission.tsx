import { useState } from "react";
import { CheckCircle2, Lightbulb, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  emoji: string;
  label: string;
  correct: boolean;
}

const OPTIONS: Option[] = [
  { id: "a", emoji: "📷", label: "One blurry photo", correct: false },
  { id: "b", emoji: "🐱", label: "Hundreds of cat photos", correct: true },
  { id: "c", emoji: "🐶", label: "A drawing of a dog", correct: false },
];

/**
 * A live, tappable sample of a real mission — the landing page's interactive
 * centerpiece. Kids pick an answer and get instant, playful feedback (a pop for
 * correct, a gentle shake for "try again"), so the product explains itself
 * without a wall of text. Fully self-contained; no data or tracking required.
 */
export function TryMission() {
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [nonce, setNonce] = useState(0);

  function choose(opt: Option) {
    if (solved) return;
    setPicked(opt.id);
    if (opt.correct) setSolved(true);
    else setNonce((n) => n + 1); // re-trigger the shake on a repeat wrong tap
  }

  function reset() {
    setPicked(null);
    setSolved(false);
    setNonce(0);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <span className="text-xl" aria-hidden>🤖</span> How does AI learn?
      </div>
      <p className="mt-3 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        Which helps an AI learn what a cat looks like?
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const isPicked = picked === opt.id;
          const isRightPick = solved && opt.correct;
          const isWrongPick = !solved && isPicked && !opt.correct;
          return (
            <button
              key={`${opt.id}-${isWrongPick ? nonce : "0"}`}
              type="button"
              onClick={() => choose(opt)}
              disabled={solved}
              aria-pressed={isPicked}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-150",
                "hover:-translate-y-1 hover:border-primary/50 hover:shadow-md active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isRightPick && "animate-pop border-success bg-success/10",
                isWrongPick && "animate-shake border-destructive/50 bg-destructive/10",
                !isPicked && "border-border",
                solved && !opt.correct && "opacity-50",
              )}
            >
              <span className="text-4xl" aria-hidden>{opt.emoji}</span>
              <span className="text-sm font-medium">{opt.label}</span>
              {isRightPick && <CheckCircle2 className="size-5 text-success" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 min-h-[3rem]" aria-live="polite">
        {solved ? (
          <div className="flex animate-pop items-start gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
            <Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="font-medium">
              Correct! 🎉 More good examples give the AI more chances to spot the pattern.
            </p>
          </div>
        ) : picked ? (
          <p className="rounded-lg bg-secondary p-3 text-sm font-medium text-secondary-foreground">
            Not quite — give it another go! 💪
          </p>
        ) : (
          <p className="p-3 text-sm text-muted-foreground">👆 Tap an answer to try it.</p>
        )}
      </div>

      {solved && (
        <Button variant="ghost" size="sm" onClick={reset} className="mt-1">
          <RotateCcw className="size-4" aria-hidden /> Try again
        </Button>
      )}
    </div>
  );
}
