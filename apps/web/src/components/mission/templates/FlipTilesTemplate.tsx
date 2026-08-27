import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChoiceTemplateProps } from "./types";

/**
 * "Open the box" — each answer hides behind a face-down tile. Tapping a tile
 * flips it open (3D rotateY) to reveal the answer and picks it. A little
 * suspense turns a plain multiple-choice into a game. Tiles are buttons, so it
 * stays keyboard- and screen-reader friendly; the flip snaps under reduced
 * motion (functionality unchanged).
 */
export function FlipTilesTemplate({
  prompt,
  options,
  selected,
  onSelect,
  disabled,
  result,
}: ChoiceTemplateProps) {
  // Which boxes have been opened (revealed). Opening also selects.
  const [opened, setOpened] = useState<Set<string>>(() => new Set());

  function open(id: string) {
    if (disabled) return;
    setOpened((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    onSelect(id);
  }

  return (
    <div className="space-y-3">
      <p className="text-base font-semibold">{prompt}</p>
      <p className="text-xs text-muted-foreground">Tap a box to open it and choose your answer.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((opt, i) => {
          const isOpen = opened.has(opt.id);
          const isSel = selected === opt.id;
          const verdict =
            isSel && result
              ? result.correct
                ? "ring-success"
                : "ring-destructive animate-shake"
              : isSel
                ? "ring-primary"
                : "ring-transparent";
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => open(opt.id)}
              aria-pressed={isSel}
              aria-label={isOpen ? `Choose: ${opt.label}` : `Open box ${i + 1}`}
              style={{ perspective: "700px" }}
              className={cn(
                "relative h-28 rounded-2xl outline-none transition-transform duration-150",
                "focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
                !disabled && "hover:-translate-y-0.5",
              )}
            >
              <span className={cn("flip-3d absolute inset-0 rounded-2xl ring-2", verdict, isOpen && "is-open")}>
                {/* Face-down cover */}
                <span
                  className="flip-face absolute inset-0 flex items-center justify-center rounded-2xl text-3xl text-primary-foreground shadow-sm"
                  style={{ backgroundImage: "var(--gradient-brand)" }}
                  aria-hidden
                >
                  {isOpen ? "" : "❓"}
                </span>
                {/* Revealed answer */}
                <span
                  className={cn(
                    "flip-face flip-back absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-card p-2 text-center",
                    isSel && result?.correct ? "border-success" : isSel ? "border-primary" : "border-border",
                  )}
                  aria-hidden
                >
                  <span className="text-2xl">{opt.emoji ?? String.fromCharCode(65 + i)}</span>
                  <span className="text-xs font-medium leading-tight">{opt.label}</span>
                  {isSel && (
                    <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
