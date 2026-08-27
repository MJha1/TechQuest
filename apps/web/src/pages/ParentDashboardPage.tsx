import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Play, Users, Lightbulb, MessageCircleQuestion, Clock, GraduationCap, CheckCircle2, Award } from "lucide-react";
import type { ParentChildDashboard, ParentDashboard } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { parentNav } from "@/lib/nav";
import { getParentDashboard } from "@/lib/api";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { SignOutButton } from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { WeeklyActivity } from "@/components/parent/WeeklyActivity";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

/** Friendly relative day label for the activity feed. */
function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** A single progress "meter": a colored ring with a value in the middle. */
function RingStat({
  value,
  max,
  color,
  center,
  label,
  hint,
}: {
  value: number;
  max: number;
  color: string;
  center: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2" title={hint}>
      <ProgressRing value={value} max={max} size={96} stroke={8} color={color}>
        <div className="text-center leading-none">{center}</div>
      </ProgressRing>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

/** Icon + status color for a recent-activity row (color is always paired with an icon). */
function activityMeta(label: string) {
  const l = label.toLowerCase();
  if (l.startsWith("completed")) return { Icon: CheckCircle2, color: "text-success", ring: "bg-success/15" };
  if (l.startsWith("earned") || l.includes("badge")) return { Icon: Award, color: "text-xp", ring: "bg-xp/15" };
  return { Icon: Play, color: "text-info", ring: "bg-info/15" }; // started / default
}

/** One child's educational summary. Calm and informative — not gamified. */
function ChildDashboard({
  child,
  onEnter,
}: {
  child: ParentChildDashboard;
  onEnter: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <span className="text-2xl" aria-hidden>{child.avatar ?? "🚀"}</span>
          {child.nickname}
        </h2>
        <Button size="sm" variant="outline" onClick={onEnter}>
          <Play className="size-4" /> Enter learning space
        </Button>
      </div>

      {/* Learning Progress — visual meters, a weekly activity strip, and the
          concepts explored. Kid-friendly, but grounded only in real data. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learning Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Meters */}
          <div className="flex flex-wrap items-start justify-center gap-6 sm:justify-around">
            <RingStat
              label="Missions"
              value={child.missionsCompleted}
              max={Math.max(child.totalMissions, 1)}
              color="var(--color-success)"
              hint={`${child.missionsCompleted} of ${child.totalMissions} missions completed`}
              center={
                <>
                  <span className="text-2xl font-bold tabular-nums">{child.missionsCompleted}</span>
                  <span className="text-sm text-muted-foreground">/{child.totalMissions}</span>
                </>
              }
            />
            <RingStat
              label="Level"
              value={child.xp % 100}
              max={100}
              color="var(--color-xp)"
              hint={`Level ${child.level} · ${child.xp} XP · ${100 - (child.xp % 100)} XP to the next level`}
              center={
                <>
                  <span className="text-2xl font-bold tabular-nums">{child.level}</span>
                  <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {child.xp} XP
                  </span>
                </>
              }
            />
            {/* Streak has no denominator, so a solid badge — not a false ring. */}
            <div className="flex flex-col items-center gap-2" title={`${child.streak}-day streak`}>
              <div className="flex size-24 flex-col items-center justify-center rounded-full bg-xp/15">
                <span className="text-2xl" aria-hidden>🔥</span>
                <span className="text-xl font-bold tabular-nums leading-none">{child.streak}</span>
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Day streak</p>
            </div>
          </div>

          {/* Plain-language recap (also the accessible source of the numbers). */}
          <p className="text-center text-sm text-muted-foreground">
            {child.missionsCompleted} of {child.totalMissions} missions completed · ~{child.learningMinutes} min learning time
          </p>

          <WeeklyActivity activity={child.recentActivity} />

          {child.conceptsLearned.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Concepts {child.nickname} explored
              </p>
              <ul className="flex flex-wrap gap-2">
                {child.conceptsLearned.map((concept) => (
                  <li
                    key={concept}
                    className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium"
                  >
                    💡 {concept}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* What Your Child Learned */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-primary" /> What {child.nickname} Learned
            </CardTitle>
          </CardHeader>
          <CardContent>
            {child.whatLearned.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Takeaways will appear here as {child.nickname} completes missions.
              </p>
            ) : (
              <ul className="space-y-3">
                {child.whatLearned.map((item) => (
                  <li key={item.mission} className="flex gap-2 text-sm">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-xp" />
                    <span>
                      <span className="font-medium">{item.summary}</span>
                      <span className="block text-xs text-muted-foreground">from “{item.mission}”</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-muted-foreground" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {child.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {child.recentActivity.map((a, i) => {
                  const { Icon, color, ring } = activityMeta(a.label);
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Try This At Home */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircleQuestion className="size-4 text-primary" /> Try This At Home
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {child.tryAtHome.length === 0 && !child.recommended?.prompt ? (
            <p className="text-sm text-muted-foreground">
              Conversation starters will appear here as {child.nickname} learns.
            </p>
          ) : (
            <ul className="space-y-2">
              {child.tryAtHome.map((item) => (
                <li key={item.mission} className="rounded-lg bg-secondary p-3 text-sm">
                  <p className="font-medium">“{item.prompt}”</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">After “{item.mission}”</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Recommended next activity */}
      {child.recommended && (
        <Card>
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recommended next activity
            </p>
            <CardTitle className="text-base">{child.recommended.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {child.recommended.concept} · about {child.recommended.estimatedMinutes} min
            </p>
            {child.recommended.prompt && (
              <p>You could ask afterwards: “{child.recommended.prompt}”</p>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

/**
 * Parent dashboard — a trustworthy, educational overview of each learner's
 * progress, what they've learned, recent activity, and at-home conversation
 * prompts. Intentionally calm (not gamified). Also the entry point into a
 * child's learning space.
 */
export default function ParentDashboardPage() {
  const { enterChild, activeChild } = useChildContext();
  const navigate = useNavigate();

  const [data, setData] = useState<ParentDashboard | null>(null);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    setData(null);
    getParentDashboard()
      .then(setData)
      .catch(() => setError(true));
  }
  useEffect(load, []);
  useEffect(() => track("parent_dashboard_viewed"), []);

  function enter(childId: string) {
    enterChild(childId);
    navigate("/child");
  }

  return (
    <AppShell
      experience="parent"
      items={parentNav}
      title="Dashboard"
      sidebarFooter={<SignOutButton className="w-full" />}
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            An overview of your {data && data.children.length === 1 ? "learner's" : "learners'"} progress.
          </p>
          <div className="flex items-center gap-2">
            {activeChild && (
              <Button variant="outline" size="sm" onClick={() => navigate("/child")}>
                <span className="text-base leading-none" aria-hidden>
                  {activeChild.avatar ?? "🚀"}
                </span>
                Back to {activeChild.nickname}
              </Button>
            )}
            <Button asChild size="sm">
              <Link to="/create-child">
                <UserPlus className="size-4" /> Add learner
              </Link>
            </Button>
          </div>
        </div>

        {error && <ErrorState title="We couldn't load your dashboard" onRetry={load} />}
        {!error && data === null && <LoadingState label="Loading dashboard…" />}

        {!error && data && data.children.length === 0 && (
          <EmptyState
            icon={<Users className="size-7" />}
            title="No learners yet"
            description="Add your first learner profile to get started."
            action={
              <Button asChild>
                <Link to="/create-child">
                  <UserPlus className="size-4" /> Add a learner
                </Link>
              </Button>
            }
          />
        )}

        {!error &&
          data &&
          data.children.map((child) => (
            <ChildDashboard key={child.id} child={child} onEnter={() => enter(child.id)} />
          ))}
      </div>
    </AppShell>
  );
}
