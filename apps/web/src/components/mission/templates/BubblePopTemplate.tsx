import { cn } from "@/lib/utils";
import type { ChoiceTemplateProps } from "./types";

/** A few soft, kid-friendly bubble gradients, assigned in order. */
const BUBBLE_TINTS = [
  "linear-gradient(135deg, hsl(205 85% 58%), hsl(225 80% 62%))",
  "linear-gradient(135deg, hsl(275 70% 62%), hsl(310 70% 60%))",
  "linear-gradient(135deg, hsl(157 62% 46%), hsl(180 66% 44%))",
  "linear-gradient(135deg, hsl(28 92% 56%), hsl(12 86% 58%))",
  "linear-gradient(135deg, hsl(45 95% 54%), hsl(35 92% 52%))",
  "linear-gradient(135deg, hsl(340 80% 62%), hsl(0 78% 60%))",
];

/**
 * "Bubble pop" — the answers drift as floating bubbles; tapping one picks it and
 * gives it a springy pop. Playful and tactile. Bubbles are buttons (keyboard /
 * screen-reader friendly) and the bobbing stops under reduced motion.
 */
export function BubblePopTemplate({
  prompt,
  options,
  selected,
  onSelect,
  disabled,
  result,
}: ChoiceTemplateProps) {
  return (
    <div className="space-y-4">
      <p className="text-base font-semibold">{prompt}</p>
      <div className="flex flex-wrap justify-center gap-4 py-2">
        {options.map((opt, i) => {
          const isSel = selected === opt.id;
          const verdict =
            isSel && result
              ? result.correct
                ? "ring-4 ring-success"
                : "ring-4 ring-destructive animate-shake"
              : isSel
                ? "ring-4 ring-primary scale-105 animate-pop"
                : "ring-0";
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(opt.id)}
              aria-pressed={isSel}
              aria-label={`Choose: ${opt.label}`}
              className={cn(
                "group flex min-h-32 min-w-32 max-w-44 flex-col items-center justify-center gap-1.5 rounded-full p-4 text-center text-primary-foreground shadow-md outline-none transition-all duration-200",
                "focus-visible:ring-4 focus-visible:ring-ring active:scale-95",
                !disabled && "hover:-translate-y-1 hover:shadow-lg",
                !disabled && !isSel && "animate-float",
                verdict,
              )}
              style={{ backgroundImage: BUBBLE_TINTS[i % BUBBLE_TINTS.length], animationDelay: `${i * 180}ms` }}
            >
              <span className="text-3xl transition-transform duration-200 group-hover:scale-110" aria-hidden>
                {opt.emoji ?? String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm font-semibold leading-tight drop-shadow-sm">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
