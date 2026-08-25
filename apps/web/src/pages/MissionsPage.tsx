import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ChildMissionSummary } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { childNav } from "@/lib/nav";
import { listChildMissions } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { MissionCard, type MissionCardStatus } from "@/components/MissionCard";
import { XPDisplay } from "@/components/XPDisplay";
import { StreakDisplay } from "@/components/StreakDisplay";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

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

  const [missions, setMissions] = useState<ChildMissionSummary[] | null>(null);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    setMissions(null);
    listChildMissions(child.id)
      .then(setMissions)
      .catch(() => setError(true));
  }

  useEffect(load, [child.id]);

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
        {error && <ErrorState onRetry={load} />}
        {missions && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {missions.map((m) => {
              const status = statusOf(m);
              const progress =
                m.totalSteps > 0 ? Math.round((m.completedSteps / m.totalSteps) * 100) : 0;
              return (
                <MissionCard
                  key={m.mission.id}
                  title={m.mission.title}
                  concept={m.mission.concept}
                  status={status}
                  progress={progress}
                  estimatedMinutes={m.mission.estimatedMinutes}
                  onAction={() => navigate(`/missions/${m.mission.id}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
