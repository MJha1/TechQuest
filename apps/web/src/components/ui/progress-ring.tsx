import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A circular progress ring drawn around its children (e.g. a mission character).
 * Self-contained SVG: the arc length comes from value/max. Purely decorative
 * (aria-hidden) — always pair it with real progress text for screen readers.
 */
export function ProgressRing({
  value,
  max = 100,
  size = 88,
  stroke = 5,
  color = "var(--color-primary)",
  className,
  children,
}: {
  value: number;
  max?: number;
  /** Diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  stroke?: number;
  /** Arc color (any CSS color; defaults to the brand primary). */
  color?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          style={{ stroke: "var(--color-border)" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ stroke: color }}
        />
      </svg>
      {children}
    </div>
  );
}
