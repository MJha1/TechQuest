import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/lib/useCountUp";

/**
 * Experience-points readout. `compact` is a chip for the top bar; `large` is a
 * celebratory tile (gradient) for profile/reward surfaces. Presentational only —
 * XP values are computed server-side.
 */
export function XPDisplay({
  xp,
  level,
  size = "compact",
  className,
}: {
  xp: number;
  level?: number;
  size?: "compact" | "large";
  className?: string;
}) {
  const shownXp = useCountUp(xp);
  const xpLabel = `${shownXp.toLocaleString()} XP`;

  if (size === "large") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-xl p-5 text-xp-foreground shadow-sm",
          className,
        )}
        style={{ backgroundImage: "var(--gradient-xp)" }}
      >
        <Sparkles className="size-8 shrink-0 animate-float" aria-hidden />
        <div>
          <p className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            {xpLabel}
          </p>
          {level !== undefined && <p className="text-sm font-medium opacity-90">Level {level}</p>}
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-xp/15 px-2.5 py-1 text-sm font-semibold text-xp-foreground",
        className,
      )}
    >
      <Sparkles className="size-4 text-xp" aria-hidden />
      <span className="tabular-nums">{xpLabel}</span>
      {level !== undefined && (
        <span className="text-muted-foreground">· Lv {level}</span>
      )}
    </span>
  );
}
