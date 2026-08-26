import { cn } from "@/lib/utils";

/**
 * The animated "character" tile for a mission: a gradient square with the
 * mission's emoji that gently bobs at rest, wiggles and throws sparkles on
 * hover, and can show a pulsing ring when it's the recommended next step.
 *
 * Wrap-free and self-contained (its own `group`), so it animates on hover
 * whether it sits in a card, a hero, or a list. All motion is reduced-motion
 * safe via the global prefers-reduced-motion rule.
 */
export function MissionCharacter({
  emoji,
  gradient,
  size = "md",
  highlight = false,
  delayIndex = 0,
  className,
}: {
  emoji: string;
  /** CSS gradient for the tile (defaults to the brand gradient). */
  gradient?: string;
  size?: "sm" | "md" | "lg";
  /** Draw a pulsing ring (for the recommended next mission). */
  highlight?: boolean;
  /** Staggers the idle bob so a row of characters doesn't move in lockstep. */
  delayIndex?: number;
  className?: string;
}) {
  const tileSize =
    size === "lg" ? "size-16 text-4xl" : size === "sm" ? "size-10 text-xl" : "size-12 text-2xl";

  return (
    <div className={cn("group relative inline-flex shrink-0", className)}>
      {highlight && (
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary animate-pulse-ring"
          aria-hidden
        />
      )}
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl text-primary-foreground shadow-sm transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-3",
          tileSize,
        )}
        style={{ backgroundImage: gradient ?? "var(--gradient-brand)" }}
        aria-hidden
      >
        <span
          className="inline-block animate-float group-hover:animate-wiggle"
          style={{ animationDelay: `${delayIndex * 120}ms` }}
        >
          {emoji}
        </span>
      </div>
      <span
        className="pointer-events-none absolute -right-1 -top-1 text-sm opacity-0 group-hover:animate-sparkle"
        aria-hidden
      >
        ✨
      </span>
      <span
        className="pointer-events-none absolute -left-1 top-2 text-xs opacity-0 group-hover:animate-sparkle [animation-delay:120ms]"
        aria-hidden
      >
        ✨
      </span>
    </div>
  );
}
