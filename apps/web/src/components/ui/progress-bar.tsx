import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/lib/useCountUp";

const TONE_CLASS = {
  brand: "bg-primary",
  xp: "bg-xp",
  success: "bg-success",
  accent: "bg-accent",
} as const;

export interface ProgressBarProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Current value (0..max). */
  value: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Bar fill color. */
  tone?: keyof typeof TONE_CLASS;
  /** Optional caption above the bar. */
  label?: React.ReactNode;
  /** Show the "value / max" readout next to the label. */
  showValue?: boolean;
  /** Sweep the fill up from 0 and count the readout up on first mount (reward
   *  feedback for a freshly loaded screen). Snaps under reduced motion. */
  animateOnMount?: boolean;
}

/**
 * Accessible progress bar. The fill width transitions so progress changes are
 * legible feedback (the one animation here that aids understanding).
 */
const ProgressBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressBarProps
>(({ className, value, max = 100, tone = "brand", label, showValue, animateOnMount = false, ...props }, ref) => {
  const clamped = Math.max(0, Math.min(value, max));
  // When animating on mount, the readout and fill both count up from 0 in sync;
  // `useCountUp` snaps to the real value under reduced motion / in tests, so
  // aria-valuenow (always the real `clamped`) and the readout still agree there.
  const shown = useCountUp(clamped, animateOnMount);
  const pct = max === 0 ? 0 : (shown / max) * 100;

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{label}</span>
          {showValue && <span>{shown} / {max}</span>}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        value={clamped}
        max={max}
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted"
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full rounded-full",
            // While counting up, rAF drives the width each frame; a CSS width
            // transition would smear it, so only transition for later changes.
            animateOnMount ? "" : "transition-[width] duration-300 ease-out",
            TONE_CLASS[tone],
          )}
          style={{ width: `${pct}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
});
ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
