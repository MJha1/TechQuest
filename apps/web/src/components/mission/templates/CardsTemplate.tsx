import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChoiceTemplateProps } from "./types";

/**
 * "Quiz" — the default choice presentation: a vertical list of answer cards.
 * Clear, scannable, keyboard/screen-reader friendly (real radio inputs).
 */
export function CardsTemplate({
  prompt,
  options,
  selected,
  onSelect,
  disabled,
  result,
  stepId,
}: ChoiceTemplateProps) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="mb-3 text-base font-semibold">{prompt}</legend>
      <div className="flex flex-col gap-3">
        {options.map((opt, i) => {
          const isSel = selected === opt.id;
          // Once answered, the chosen card reflects the verdict: green when
          // correct, a gentle red shake when not. Kind, never harsh.
          const stateClass = isSel
            ? result
              ? result.correct
                ? "border-success bg-success/10 shadow-sm"
                : "border-destructive bg-destructive/10 animate-shake"
              : "border-primary bg-primary/10 shadow-sm"
            : "border-border";
          return (
            <label
              key={opt.id}
              className={cn(
                "group flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-150",
                "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:scale-[0.99]",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                stateClass,
              )}
            >
              <input
                type="radio"
                name={`step-${stepId}`}
                value={opt.id}
                checked={isSel}
                onChange={() => onSelect(opt.id)}
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
