import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Play, Users, Lightbulb, MessageCircleQuestion, Clock, GraduationCap } from "lucide-react";
import type { ParentChildDashboard, ParentDashboard } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { parentNav } from "@/lib/nav";
import { getParentDashboard } from "@/lib/api";
import { track } from "@/lib/analytics";
import { AppShell } from "@/components/layout/AppShell";
import { SignOutButton } from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
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
        <h2 className="text-xl font-semibold">{child.nickname}</h2>
        <Button size="sm" variant="outline" onClick={onEnter}>
          <Play className="size-4" /> Enter learning space
        </Button>
      </div>

      {/* Learning Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learning Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar
            value={child.missionsCompleted}
            max={Math.max(child.totalMissions, 1)}
            tone="success"
            label={`${child.missionsCompleted} of ${child.totalMissions} missions completed`}
            showValue
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Learning time" value={`~${child.learningMinutes} min`} />
            <Stat label="Level" value={child.level} />
            <Stat label="XP" value={child.xp} />
            <Stat label="Day streak" value={child.streak} />
            <Stat label="Concepts learned" value={child.conceptsLearned.length} />
          </div>
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
              <ul className="space-y-2">
                {child.recentActivity.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span>{a.label}</span>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                  </li>
                ))}
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
  const { enterChild } = useChildContext();
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
          <Button asChild size="sm">
            <Link to="/create-child">
              <UserPlus className="size-4" /> Add learner
            </Link>
          </Button>
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
