import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Sparkles, Trophy } from "lucide-react";
import type { BadgeStatus, ChildMissionSummary } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { childNav } from "@/lib/nav";
import { listChildBadges, listChildMissions } from "@/lib/api";
import { track } from "@/lib/analytics";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { XPDisplay } from "@/components/XPDisplay";
import { StreakDisplay } from "@/components/StreakDisplay";

/** The mission to feature: the one in progress, else the next unfinished one. */
function pickTodaysMission(missions: ChildMissionSummary[]): ChildMissionSummary | null {
  return (
    missions.find((m) => m.progress?.status === "IN_PROGRESS") ??
    missions.find((m) => m.progress?.status !== "COMPLETED") ??
    null
  );
}

/** The next unfinished mission that isn't today's — a gentle suggestion. */
function pickRecommended(
  missions: ChildMissionSummary[],
  todays: ChildMissionSummary | null,
): ChildMissionSummary | null {
  return (
    missions.find(
      (m) => m.mission.slug !== todays?.mission.slug && m.progress?.status !== "COMPLETED",
    ) ?? null
  );
}

/**
 * Child home dashboard.
 *
 * Left: navigation (AppShell sidebar). Center: today's mission (+ Start Mission),
 * overall progress, and a recommended mission. Right: XP, level, streak, badges.
 *
 * Deliberately kid-safe: it shows only nicknames, friendly copy, and progress —
 * never database ids, raw errors, API details, parent info, or system jargon.
 */
export default function ChildHomePage() {
  const { activeChild } = useChildContext();
  const child = activeChild!; // guaranteed by RequireChild
  const navigate = useNavigate();

  const [missions, setMissions] = useState<ChildMissionSummary[] | null>(null);
  const [badges, setBadges] = useState<BadgeStatus[] | null>(null);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    setMissions(null);
    setBadges(null);
    Promise.all([listChildMissions(child.id), listChildBadges(child.id)])
      .then(([m, b]) => {
        setMissions(m);
        setBadges(b);
      })
      .catch(() => setError(true));
  }

  useEffect(load, [child.id]);
  useEffect(() => track("child_home_viewed", { childRef: child.id }), [child.id]);

  const todays = useMemo(() => (missions ? pickTodaysMission(missions) : null), [missions]);
  const recommended = useMemo(
    () => (missions ? pickRecommended(missions, todays) : null),
    [missions, todays],
  );
  const completedCount = missions?.filter((m) => m.progress?.status === "COMPLETED").length ?? 0;
  const totalMissions = missions?.length ?? 0;
  const earnedBadges = badges?.filter((b) => b.earned) ?? [];

  const rewards = (
    <div className="space-y-4">
      <XPDisplay xp={child.xp} level={child.level} size="large" />
      <StreakDisplay streak={child.streak} size="large" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4 text-xp" /> Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badges === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : earnedBadges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Finish a mission to earn your first badge!
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {earnedBadges.map((b) => (
                <li
                  key={b.badge.slug}
                  title={b.badge.description}
                  className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                >
                  <span aria-hidden>{b.badge.icon ?? "🏅"}</span>
                  {b.badge.name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AppShell
      experience="child"
      items={childNav}
      title={`Hi, ${child.nickname}! 👋`}
      sidebarFooter={
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{child.avatar ?? "🙂"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{child.nickname}</p>
            <p className="text-xs text-muted-foreground">Level {child.level}</p>
          </div>
        </div>
      }
      topBarRight={
        <>
          <StreakDisplay streak={child.streak} />
          <XPDisplay xp={child.xp} level={child.level} />
        </>
      }
      rightPanel={rewards}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {error && (
          <ErrorState
            title="We couldn't load your dashboard"
            description="Let's give it another try."
            onRetry={load}
          />
        )}

        {!error && missions === null && <LoadingState label="Getting your missions ready…" />}

        {!error && missions !== null && (
          <>
            {/* Today's Mission — the hero + primary CTA. */}
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Today's Mission
                </p>
                <CardTitle className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
                  {todays ? todays.mission.title : "You've finished every mission!"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {todays ? (
                  <>
                    <p className="text-muted-foreground">{todays.mission.concept}</p>
                    {todays.progress?.status === "IN_PROGRESS" && (
                      <ProgressBar
                        value={todays.completedSteps}
                        max={todays.totalSteps}
                        tone="brand"
                        label="Your progress"
                        showValue
                      />
                    )}
                    <Button
                      size="lg"
                      variant="accent"
                      onClick={() => navigate(`/missions/${todays.mission.id}`)}
                    >
                      <Play className="size-4" />
                      {todays.progress?.status === "IN_PROGRESS" ? "Continue Mission" : "Start Mission"}
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Amazing work — more adventures are on the way. Check back soon!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Progress across all missions. */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-primary" /> Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressBar
                  value={completedCount}
                  max={Math.max(totalMissions, 1)}
                  tone="success"
                  label={`${completedCount} of ${totalMissions} missions complete`}
                  showValue
                />
              </CardContent>
            </Card>

            {/* Recommended next mission. */}
            {recommended && (
              <Card>
                <CardHeader>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recommended next
                  </p>
                  <CardTitle className="text-lg">{recommended.mission.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {recommended.mission.concept} · about {recommended.mission.estimatedMinutes} min
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/missions/${recommended.mission.id}`)}
                  >
                    See mission
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Rewards inline for narrower screens (right panel is xl-only). */}
            <div className="xl:hidden">{rewards}</div>
          </>
        )}
      </div>
    </AppShell>
  );
}
