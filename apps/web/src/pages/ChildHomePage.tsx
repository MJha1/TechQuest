import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Sparkles, Trophy } from "lucide-react";
import type { ChildMissionSummary } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { childNav } from "@/lib/nav";
import { listChildBadges, listChildMissions } from "@/lib/api";
import { useCachedResource } from "@/lib/useCachedResource";
import { missionTheme } from "@/lib/missionTheme";
import { track } from "@/lib/analytics";
import { AppShell } from "@/components/layout/AppShell";
import { MissionCharacter } from "@/components/MissionCharacter";
import { TiltCard } from "@/components/motion/TiltCard";
import { SidebarBuddy } from "@/components/child/SidebarBuddy";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { DidYouKnowCard } from "@/components/child/DidYouKnowCard";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState, CHILD_ERROR } from "@/components/ui/error-state";
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

  // Cached (stale-while-revalidate): revisiting the home shows the last data
  // instantly and revalidates in the background. The missions key is shared with
  // the Missions page, so navigating between them is instant.
  const missionsRes = useCachedResource(`child-missions:${child.id}`, () =>
    listChildMissions(child.id),
  );
  const badgesRes = useCachedResource(`child-badges:${child.id}`, () => listChildBadges(child.id));
  const missions = missionsRes.data ?? null;
  const badges = badgesRes.data ?? null;
  const error = missionsRes.error || badgesRes.error;
  const load = () => {
    missionsRes.reload();
    badgesRes.reload();
  };

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
              {earnedBadges.map((b, i) => (
                <li
                  key={b.badge.slug}
                  title={b.badge.description}
                  className="flex animate-pop items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                  style={{ animationDelay: `${i * 90}ms` }}
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
      title={
        <>
          Hi, {child.nickname}!{" "}
          <span className="inline-block animate-wiggle [transform-origin:70%_80%]" aria-hidden>
            👋
          </span>
        </>
      }
      sidebarExtra={
        <SidebarBuddy nickname={child.nickname} level={child.level} xp={child.xp} />
      }
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
            title={CHILD_ERROR.title}
            description={CHILD_ERROR.description}
            onRetry={load}
          />
        )}

        {!error && missions === null && <LoadingState label="Getting your missions ready…" />}

        {!error && missions !== null && (
          <>
            {/* Today's Mission — the hero + primary CTA. */}
            <TiltCard className="animate-card-flip-in">
            <Card className="relative overflow-hidden bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/[0.08]">
              {/* Decorative swirl (self-contained). */}
              <svg
                className="pointer-events-none absolute -right-8 -top-8 size-40 text-primary/[0.12]"
                viewBox="0 0 200 200"
                fill="none"
                aria-hidden
              >
                <path d="M10 110 Q55 25 100 100 T190 95" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
                <path d="M30 150 Q75 85 120 150 T210 145" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
                <circle cx="158" cy="45" r="9" fill="currentColor" />
              </svg>
              {/* Floating ambient shapes — a little life at rest. */}
              <span className="pointer-events-none absolute right-6 top-6 size-3 rounded-full bg-accent/40 animate-float [animation-delay:0.3s]" aria-hidden />
              <span className="pointer-events-none absolute right-16 bottom-8 size-2 rounded-full bg-xp/50 animate-float [animation-delay:1s]" aria-hidden />
              <span className="pointer-events-none absolute right-28 top-10 text-sm opacity-70 animate-float [animation-delay:0.6s]" aria-hidden>✨</span>
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Today's Mission
                </p>
                <div className="flex items-center gap-4">
                  {todays &&
                    (todays.progress?.status === "IN_PROGRESS" && todays.totalSteps > 0 ? (
                      // Circular progress ring around the character for the featured mission.
                      <ProgressRing value={todays.completedSteps} max={todays.totalSteps}>
                        <MissionCharacter
                          emoji={missionTheme(todays.mission.slug).emoji}
                          gradient={missionTheme(todays.mission.slug).gradient}
                          size="lg"
                        />
                      </ProgressRing>
                    ) : (
                      <MissionCharacter
                        emoji={missionTheme(todays.mission.slug).emoji}
                        gradient={missionTheme(todays.mission.slug).gradient}
                        size="lg"
                      />
                    ))}
                  <CardTitle className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
                    {todays ? todays.mission.title : "You've finished every mission! 🎉"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {todays ? (
                  <>
                    <p className="text-muted-foreground">{todays.mission.concept}</p>
                    {todays.progress?.status === "IN_PROGRESS" && todays.totalSteps > 0 && (
                      // The ring shows progress visually; this caption carries it for screen readers.
                      <p className="text-sm font-semibold text-primary">
                        {todays.completedSteps} of {todays.totalSteps} steps done — keep going!
                      </p>
                    )}
                    <Button
                      size="lg"
                      variant="accent"
                      className="animate-cta-glow"
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
            </TiltCard>

            {/* Progress across all missions. */}
            <TiltCard className="animate-card-flip-in [animation-delay:80ms]">
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
                  animateOnMount
                />
              </CardContent>
            </Card>
            </TiltCard>

            {/* A dose of curiosity — one true tech/AI fact per visit. */}
            <TiltCard className="animate-card-flip-in [animation-delay:240ms]">
              <DidYouKnowCard />
            </TiltCard>

            {/* Recommended next mission. */}
            {recommended && (
              <TiltCard className="animate-card-flip-in [animation-delay:160ms]">
              <Card>
                <CardHeader>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recommended next
                  </p>
                  <div className="flex items-center gap-3">
                    <MissionCharacter
                      emoji={missionTheme(recommended.mission.slug).emoji}
                      gradient={missionTheme(recommended.mission.slug).gradient}
                      delayIndex={1}
                    />
                    <CardTitle className="text-lg">{recommended.mission.title}</CardTitle>
                  </div>
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
              </TiltCard>
            )}

            {/* Rewards inline for narrower screens (right panel is xl-only). */}
            <div className="xl:hidden">{rewards}</div>
          </>
        )}
      </div>
    </AppShell>
  );
}
