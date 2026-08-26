import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Reward colors, drawn from the design-system tokens (theme-aware). */
const COLORS = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-xp)",
  "var(--color-success)",
  "var(--color-info)",
  "var(--color-streak)",
];

/**
 * A lightweight one-shot confetti burst — no dependencies. Renders a spray of
 * colored pieces from the center of its (positioned) parent that fly outward
 * and fade. Replays whenever `trigger` changes (pass an incrementing number, or
 * 1 to fire once); renders nothing while `trigger` is 0.
 *
 * Purely decorative and reduced-motion-safe: the global prefers-reduced-motion
 * rule collapses the animation, so nothing flashes for motion-sensitive users.
 * The parent must be `position: relative`.
 */
export function Confetti({
  trigger = 0,
  pieces = 18,
  className,
}: {
  trigger?: number;
  pieces?: number;
  className?: string;
}) {
  const bits = useMemo(() => {
    // Fresh spray each time `trigger` changes: a fan of pieces, biased upward.
    return Array.from({ length: pieces }, (_, i) => {
      const spread = pieces > 1 ? (180 * i) / (pieces - 1) : 90;
      const angle = (-90 + spread + (Math.random() * 30 - 15)) * (Math.PI / 180);
      const dist = 90 + Math.random() * 90;
      return {
        dx: `${(Math.cos(angle) * dist).toFixed(0)}px`,
        dy: `${(Math.sin(angle) * dist - 40).toFixed(0)}px`,
        rot: `${Math.floor(Math.random() * 540 - 270)}deg`,
        color: COLORS[i % COLORS.length],
        delay: `${Math.floor(Math.random() * 80)}ms`,
        round: i % 2 === 0,
      };
    });
  }, [trigger, pieces]);

  if (!trigger) return null;

  return (
    <div
      key={trigger}
      aria-hidden
      className={cn("pointer-events-none absolute left-1/2 top-1/2 z-10 size-0", className)}
    >
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute block size-2 animate-confetti"
          style={{
            backgroundColor: b.color,
            borderRadius: b.round ? "9999px" : "2px",
            animationDelay: b.delay,
            // Per-piece trajectory consumed by the `confetti-burst` keyframe.
            ...({ "--dx": b.dx, "--dy": b.dy, "--rot": b.rot } as React.CSSProperties),
          }}
        />
      ))}
    </div>
  );
}
