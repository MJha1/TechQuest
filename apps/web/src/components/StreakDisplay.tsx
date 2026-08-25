import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Daily-streak readout. `compact` is a top-bar chip; `large` is a gradient tile.
 * The flame de-saturates to muted when the streak is zero, so a broken streak
 * reads as calm rather than a failure state. Presentational only.
 */
export function StreakDisplay({
  streak,
  size = "compact",
  className,
}: {
  streak: number;
  size?: "compact" | "large";
  className?: string;
}) {
  const active = streak > 0;
  const unit = streak === 1 ? "day" : "days";

  if (size === "large") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-xl p-5 shadow-sm",
          active ? "text-streak-foreground" : "bg-muted text-muted-foreground",
          className,
        )}
        style={active ? { backgroundImage: "var(--gradient-streak)" } : undefined}
      >
        <Flame className="size-8 shrink-0" aria-hidden />
        <div>
          <p className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            {streak} {unit}
          </p>
          <p className="text-sm font-medium opacity-90">
            {active ? "Streak going strong" : "Start a streak today"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold",
        active ? "bg-streak/15 text-streak-foreground" : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <Flame className={cn("size-4", active ? "text-streak" : "text-muted-foreground")} aria-hidden />
      <span className="tabular-nums">{streak}</span>
    </span>
  );
}
