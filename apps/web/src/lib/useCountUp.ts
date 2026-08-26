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
 * first mount, so a fresh reward screen ticks up. Snaps instantly under
 * prefers-reduced-motion (and in non-browser environments).
 */
export function useCountUp(target: number, durationMs = 700): number {
  const animate = canAnimate();
  const [display, setDisplay] = useState(() => (animate ? 0 : target));
  const fromRef = useRef(animate ? 0 : target);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!canAnimate()) {
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
  }, [target, durationMs]);

  return display;
}
