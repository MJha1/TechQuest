import { useEffect, useRef, useState } from "react";

/**
 * Whether we should animate at all. False under prefers-reduced-motion, and also
 * in environments without matchMedia/rAF (SSR, jsdom tests) — where we snap to
 * the value so the accessible text is always the real total.
 */
const canAnimate = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  typeof window.requestAnimationFrame === "function" &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Animate a number toward `target` (e.g. an XP total) for satisfying reward
 * feedback. Counts up from the previously shown value on change — and from 0 on
 * first mount, so a fresh reward/progress screen ticks up. Snaps instantly when
 * `enabled` is false, under prefers-reduced-motion, or in non-browser
 * environments — so the rendered value is always the real total there.
 */
export function useCountUp(target: number, enabled = true, durationMs = 700): number {
  const animate = enabled && canAnimate();
  const [display, setDisplay] = useState(() => (animate ? 0 : target));
  const fromRef = useRef(animate ? 0 : target);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !canAnimate()) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(from + delta * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [target, enabled, durationMs]);

  return display;
}
