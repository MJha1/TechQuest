import { useRef, useState } from "react";
import { RotateCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ChoiceTemplateProps } from "./types";

/** Segment colors, assigned in order (kept distinct and kid-bright). */
const SEG_COLORS = [
  "hsl(205 85% 52%)",
  "hsl(275 70% 58%)",
  "hsl(157 62% 42%)",
  "hsl(28 92% 54%)",
  "hsl(45 95% 52%)",
  "hsl(340 80% 58%)",
];

const SIZE = 220;
const EMOJI_RADIUS = 66;

/**
 * "Spin the wheel" — the answers become segments of a wheel. Press Spin and it
 * lands on one (a suggestion the child confirms), or tap an answer directly in
 * the legend. Either way the response is the same `{ optionId }`. The wheel is
 * decorative (aria-hidden); the legend buttons carry the accessible choices, so
 * it stays keyboard/screen-reader usable and works under reduced motion.
 */
export function SpinWheelTemplate({
  prompt,
  options,
  selected,
  onSelect,
  disabled,
  result,
}: ChoiceTemplateProps) {
  const n = options.length;
  const seg = 360 / n;
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const targetRef = useRef<string | null>(null);

  // Build the pie background from hard color stops (starts at 12 o'clock).
  const gradient = `conic-gradient(${options
    .map((_, i) => {
      const c = SEG_COLORS[i % SEG_COLORS.length];
      return `${c} ${i * seg}deg ${(i + 1) * seg}deg`;
    })
    .join(", ")})`;

  function spin() {
    if (disabled || spinning) return;
    const target = Math.floor(Math.random() * n);
    targetRef.current = options[target].id;
    const center = target * seg + seg / 2;
    // Rotate so the target segment's center lands under the top pointer.
    const desiredMod = (360 - center) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = 360 * 4 + ((desiredMod - currentMod + 360) % 360);
    setRotation(rotation + delta);
    setSpinning(true);
  }

  function onWheelSettled(e: React.TransitionEvent) {
    if (e.propertyName !== "transform" || !spinning) return;
    setSpinning(false);
    if (targetRef.current) onSelect(targetRef.current);
  }

  const selectedLabel = options.find((o) => o.id === selected)?.label;

  return (
    <div className="space-y-4">
      <p className="text-base font-semibold">{prompt}</p>

      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: SIZE, height: SIZE }} aria-hidden>
          {/* Pointer */}
          <div className="absolute left-1/2 top-[-6px] z-10 size-0 -translate-x-1/2 border-x-8 border-t-[14px] border-x-transparent border-t-foreground" />
          <div
            className="wheel-spin size-full rounded-full border-4 border-card shadow-md"
            style={{ backgroundImage: gradient, transform: `rotate(${rotation}deg)` }}
            onTransitionEnd={onWheelSettled}
          >
            {options.map((opt, i) => {
              const theta = ((i * seg + seg / 2) * Math.PI) / 180;
              const x = SIZE / 2 + EMOJI_RADIUS * Math.sin(theta);
              const y = SIZE / 2 - EMOJI_RADIUS * Math.cos(theta);
              return (
                <span
                  key={opt.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-2xl drop-shadow"
                  style={{ left: x, top: y }}
                >
                  {opt.emoji ?? String.fromCharCode(65 + i)}
                </span>
              );
            })}
          </div>
          {/* Hub */}
          <div className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-card bg-primary" />
        </div>

        <Button type="button" variant="accent" onClick={spin} disabled={disabled || spinning}>
          <RotateCw className={cn("size-4", spinning && "animate-spin-slow")} />
          {spinning ? "Spinning…" : "Spin!"}
        </Button>
      </div>

      {/* Legend — the accessible, tappable answers (matched to segment colors). */}
      <fieldset disabled={disabled} className="flex flex-wrap justify-center gap-2">
        <legend className="sr-only">{prompt}</legend>
        {options.map((opt, i) => {
          const isSel = selected === opt.id;
          const verdict =
            isSel && result
              ? result.correct
                ? "border-success bg-success/10"
                : "border-destructive bg-destructive/10 animate-shake"
              : isSel
                ? "border-primary bg-primary/10"
                : "border-border";
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled || spinning}
              onClick={() => onSelect(opt.id)}
              aria-pressed={isSel}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all duration-150",
                "hover:-translate-y-0.5 active:scale-95 disabled:opacity-60",
                verdict,
              )}
            >
              <span className="size-3 rounded-full" style={{ backgroundColor: SEG_COLORS[i % SEG_COLORS.length] }} aria-hidden />
              <span>{opt.emoji ? `${opt.emoji} ` : ""}{opt.label}</span>
              {isSel && <Check className="size-4 text-primary" aria-hidden />}
            </button>
          );
        })}
      </fieldset>

      {selectedLabel && (
        <p className="text-center text-sm text-muted-foreground">
          Your pick: <span className="font-semibold text-foreground">{selectedLabel}</span>
        </p>
      )}
    </div>
  );
}
