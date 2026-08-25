import type { BadgeStatus } from "@techquest/shared";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Badge showcase. Earned badges are shown in full color with their icon; badges
 * not yet earned are dimmed and locked, so a child can see what's next.
 */
export function BadgeList({ badges }: { badges: BadgeStatus[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {badges.map(({ badge, earned }) => (
        <li
          key={badge.slug}
          title={badge.description}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-4 text-center",
            earned ? "border-primary/30 bg-secondary" : "border-border opacity-60",
          )}
        >
          <span className="relative text-3xl" aria-hidden>
            {earned ? (
              badge.icon ?? "🏅"
            ) : (
              <span className="grayscale">
                {badge.icon ?? "🏅"}
                <Lock className="absolute -bottom-1 -right-1 size-4 text-muted-foreground" />
              </span>
            )}
          </span>
          <span className="text-xs font-semibold leading-tight">{badge.name}</span>
        </li>
      ))}
    </ul>
  );
}
