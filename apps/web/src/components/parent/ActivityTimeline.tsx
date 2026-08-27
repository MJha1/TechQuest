import { Play, CheckCircle2, Award } from "lucide-react";
import type { ParentActivityItem } from "@techquest/shared";
import { cn } from "@/lib/utils";

/** Friendly relative day label for the activity feed. */
function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Icon + status color for a row (color is always paired with an icon). */
function meta(label: string) {
  const l = label.toLowerCase();
  if (l.startsWith("completed")) return { Icon: CheckCircle2, color: "text-success", ring: "bg-success/15" };
  if (l.startsWith("earned") || l.includes("badge")) return { Icon: Award, color: "text-xp", ring: "bg-xp/15" };
  return { Icon: Play, color: "text-info", ring: "bg-info/15" }; // started / default
}

/**
 * Recent activity as an icon timeline (started / completed / badge). Shared by
 * the parent Dashboard and Progress pages. Status color always ships with an
 * icon + the label text, never color alone.
 */
export function ActivityTimeline({ activity }: { activity: ParentActivityItem[] }) {
  if (activity.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {activity.map((a, i) => {
        const { Icon, color, ring } = meta(a.label);
        return (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", ring)}>
              <Icon className={cn("size-4", color)} aria-hidden />
            </span>
            <span className="flex-1">{a.label}</span>
            <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(a.at)}</span>
          </li>
        );
      })}
    </ul>
  );
}
