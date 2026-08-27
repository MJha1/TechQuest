import type { ParentActivityItem } from "@techquest/shared";
import { cn } from "@/lib/utils";

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * A 7-day activity strip derived from real `recentActivity` timestamps: each
 * bar's height is how many things happened that day. Single-series (one hue),
 * baseline-anchored, with a per-bar hover tooltip. No invented data — a day with
 * nothing shows a faint baseline dot, and the whole strip carries an aria label.
 */
export function WeeklyActivity({ activity }: { activity: ParentActivityItem[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Oldest → today, so the last bar is "today".
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return { date, count: 0 };
  });
  for (const a of activity) {
    const t = new Date(a.at);
    if (Number.isNaN(t.getTime())) continue;
    t.setHours(0, 0, 0, 0);
    const bucket = days.find((d) => d.date.getTime() === t.getTime());
    if (bucket) bucket.count += 1;
  }
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">This week</p>
        <p className="text-xs text-muted-foreground">
          {total} {total === 1 ? "activity" : "activities"}
        </p>
      </div>
      <div
        className="flex items-end gap-1.5"
        role="img"
        aria-label={`${total} learning ${total === 1 ? "activity" : "activities"} in the last 7 days`}
      >
        {days.map((d, i) => {
          const isToday = i === 6;
          const heightPct = d.count === 0 ? 0 : Math.max(12, Math.round((d.count / max) * 100));
          const weekday = d.date.toLocaleDateString(undefined, { weekday: "short" });
          return (
            <div key={i} className="group/bar relative flex flex-1 flex-col items-center gap-1">
              <span className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow group-hover/bar:block">
                {d.count} on {weekday}
              </span>
              <div className="flex h-16 w-full items-end justify-center">
                {d.count === 0 ? (
                  <span className="mb-1 size-1.5 rounded-full bg-border" aria-hidden />
                ) : (
                  <div
                    className={cn(
                      "w-full max-w-[1.75rem] rounded-t-md transition-[height] duration-500 ease-out",
                      isToday ? "bg-primary" : "bg-primary/55",
                    )}
                    style={{ height: `${heightPct}%` }}
                    aria-hidden
                  />
                )}
              </div>
              <span className={cn("text-[10px]", isToday ? "font-bold text-primary" : "text-muted-foreground")}>
                {DAY_INITIALS[d.date.getDay()]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
