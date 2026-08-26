import { useNavigate } from "react-router-dom";
import type { ChildMissionSummary } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { childNav } from "@/lib/nav";
import { listChildMissions } from "@/lib/api";
import { useCachedResource } from "@/lib/useCachedResource";
import { missionTheme } from "@/lib/missionTheme";
import { track } from "@/lib/analytics";
import { AppShell } from "@/components/layout/AppShell";
import { MissionCard, type MissionCardStatus } from "@/components/MissionCard";
import { XPDisplay } from "@/components/XPDisplay";
import { StreakDisplay } from "@/components/StreakDisplay";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState, CHILD_ERROR } from "@/components/ui/error-state";

/** Map server progress to the presentational MissionCard status. */
function statusOf(summary: ChildMissionSummary): MissionCardStatus {
  if (!summary.progress) return "available";
  if (summary.progress.status === "COMPLETED") return "completed";
  return "in_progress";
}

/**
 * Mission list for the active child — fully data-driven. Missions come from the
 * API (catalog joined with the child's progress); nothing is hardcoded.
 */
export default function MissionsPage() {
  const { activeChild } = useChildContext();
  const child = activeChild!;
  const navigate = useNavigate();

  // Shares the `child-missions` cache with the child home, so switching between
  // the two is instant; only the first load waits on the network.
  const res = useCachedResource(`child-missions:${child.id}`, () => listChildMissions(child.id));
  const missions = res.data ?? null;
  const error = res.error;
  const load = res.reload;

  // The one mission to guide the child toward: the one in progress, else the
  // first not-yet-completed one. Gets the "Start here" highlight. -1 = none.
  const nextIndex = missions
    ? (() => {
        const inProgress = missions.findIndex((m) => statusOf(m) === "in_progress");
        if (inProgress !== -1) return inProgress;
        return missions.findIndex((m) => statusOf(m) === "available");
      })()
    : -1;

  return (
    <AppShell
      experience="child"
      items={childNav}
      title="Missions"
      topBarRight={
        <>
          <StreakDisplay streak={child.streak} />
          <XPDisplay xp={child.xp} level={child.level} />
        </>
      }
    >
      <div className="mx-auto max-w-5xl">
        {missions === null && !error && <LoadingState label="Loading missions…" />}
        {error && (
          <ErrorState title={CHILD_ERROR.title} description={CHILD_ERROR.description} onRetry={load} />
        )}
        {missions && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-medium">
                Pick a mission and let&apos;s explore AI together! 🚀
              </p>
              {(() => {
                const completed = missions.filter((m) => statusOf(m) === "completed").length;
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                    ⭐ {completed} of {missions.length} complete
                  </span>
                );
              })()}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {missions.map((m, i) => {
                const status = statusOf(m);
                const progress =
                  m.totalSteps > 0 ? Math.round((m.completedSteps / m.totalSteps) * 100) : 0;
                const theme = missionTheme(m.mission.slug);
                return (
                  <MissionCard
                    key={m.mission.id}
                    index={i}
                    title={m.mission.title}
                    concept={m.mission.concept}
                    status={status}
                    progress={progress}
                    estimatedMinutes={m.mission.estimatedMinutes}
                    emoji={theme.emoji}
                    gradient={theme.gradient}
                    isNext={i === nextIndex}
                    onAction={() => {
                      track("mission_viewed", { missionSlug: m.mission.slug });
                      navigate(`/missions/${m.mission.id}`);
                    }}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
