import type { ParentChildDashboard } from "@techquest/shared";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useCountUp } from "@/lib/useCountUp";

/** Mirrors the server gamification rule (XP_PER_LEVEL): a new level every 100 XP. */
const XP_PER_LEVEL = 100;

/** A single ring meter: a colored ring with a value in the middle and a label. */
function RingMeter({
  value,
  max,
  color,
  center,
  label,
  hint,
  animate,
}: {
  value: number;
  max: number;
  color: string;
  center: React.ReactNode;
  label: string;
  hint: string;
  animate: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2" title={hint}>
      <ProgressRing value={value} max={max} size={96} stroke={8} color={color} animateOnMount={animate}>
        <div className="text-center leading-none">{center}</div>
      </ProgressRing>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * The shared "at a glance" meters for a learner: a Missions donut, a Level ring
 * (XP toward the next level), and a streak badge, plus a plain-language recap
 * line that also carries the exact numbers for screen readers. Used by both the
 * parent Dashboard and Progress pages so they stay consistent.
 *
 * Pass `animate` to sweep the rings in and count the numbers up on mount
 * (reduced-motion falls back to an instant, final render).
 */
export function ProgressMeters({
  child,
  animate = false,
}: {
  child: ParentChildDashboard;
  animate?: boolean;
}) {
  const intoLevel = Math.max(0, child.xp) % XP_PER_LEVEL;
  const missions = useCountUp(child.missionsCompleted, animate);
  const level = useCountUp(child.level, animate);
  const xp = useCountUp(child.xp, animate);
  const streak = useCountUp(child.streak, animate);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-center gap-6 sm:justify-around">
        <RingMeter
          animate={animate}
          label="Missions"
          value={child.missionsCompleted}
          max={Math.max(child.totalMissions, 1)}
          color="var(--color-success)"
          hint={`${child.missionsCompleted} of ${child.totalMissions} missions completed`}
          center={
            <>
              <span className="text-2xl font-bold tabular-nums">{missions}</span>
              <span className="text-sm text-muted-foreground">/{child.totalMissions}</span>
            </>
          }
        />
        <RingMeter
          animate={animate}
          label="Level"
          value={intoLevel}
          max={XP_PER_LEVEL}
          color="var(--color-xp)"
          hint={`Level ${child.level} · ${child.xp} XP · ${XP_PER_LEVEL - intoLevel} XP to the next level`}
          center={
            <>
              <span className="text-2xl font-bold tabular-nums">{level}</span>
              <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {xp} XP
              </span>
            </>
          }
        />
        {/* Streak has no denominator, so a solid badge — not a false ring. */}
        <div className="flex flex-col items-center gap-2" title={`${child.streak}-day streak`}>
          <div className="flex size-24 flex-col items-center justify-center rounded-full bg-xp/15">
            <span className="text-2xl" aria-hidden>🔥</span>
            <span className="text-xl font-bold tabular-nums leading-none">{streak}</span>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Day streak</p>
        </div>
      </div>

      {/* Plain-language recap (also the accessible source of the numbers). */}
      <p className="text-center text-sm text-muted-foreground">
        {child.missionsCompleted} of {child.totalMissions} missions completed · ~{child.learningMinutes} min learning time
      </p>
    </div>
  );
}
