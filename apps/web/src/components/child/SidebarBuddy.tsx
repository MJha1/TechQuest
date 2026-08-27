import { ProgressRing } from "@/components/ui/progress-ring";
import { RobotMascot } from "@/components/landing/illustrations";

/** Mirrors the server gamification rule (XP_PER_LEVEL): a new level every 100 XP. */
const XP_PER_LEVEL = 100;

/**
 * A friendly "learning buddy" for the child sidebar: a bobbing robot mascot
 * ringed by an XP-to-next-level meter, plus a short encouraging line. Fills what
 * would otherwise be dead space below the (short) child nav, and gives the space
 * a warm, motivating presence. All motion is reduced-motion safe.
 */
export function SidebarBuddy({
  nickname,
  level,
  xp,
}: {
  nickname: string;
  level: number;
  xp: number;
}) {
  const intoLevel = Math.max(0, xp) % XP_PER_LEVEL;
  const toNext = XP_PER_LEVEL - intoLevel;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 p-4 text-center">
      <div className="mx-auto w-fit">
        {/* The XP ring sweeps in on mount; the mascot bobs inside it. */}
        <ProgressRing
          value={intoLevel}
          max={XP_PER_LEVEL}
          size={96}
          stroke={5}
          color="var(--color-xp)"
          animateOnMount
        >
          <div className="w-14 transition-transform duration-300 ease-out group-hover:-rotate-3 group-hover:scale-110">
            <RobotMascot className="w-full" />
          </div>
        </ProgressRing>
      </div>
      <p className="mt-2 text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Level {level}
      </p>
      <p className="text-xs text-muted-foreground">
        {toNext} XP to level {level + 1}
      </p>
      <p className="mt-1 text-xs font-medium text-primary">
        You&apos;re doing great, {nickname}! ✨
      </p>
    </div>
  );
}
