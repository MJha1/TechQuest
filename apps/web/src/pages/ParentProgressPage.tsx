import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Users,
  UserPlus,
  Star,
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  GraduationCap,
} from "lucide-react";
import type { ParentChildDashboard, ParentDashboard } from "@techquest/shared";
import { parentNav } from "@/lib/nav";
import { getParentDashboard } from "@/lib/api";
import { track } from "@/lib/analytics";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

/** Mirrors the server gamification rule (XP_PER_LEVEL): a new level every 100 XP. */
const XP_PER_LEVEL = 100;

/** A child has something worth reporting once they've earned XP, completed a
 * mission, or generated any activity. */
function hasProgress(child: ParentChildDashboard): boolean {
  return child.xp > 0 || child.missionsCompleted > 0 || child.recentActivity.length > 0;
}

/** Friendly relative day label for the activity feed. */
function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** One child's progress report: XP, level, streaks, missions, and recent activity. */
function ChildProgress({ child }: { child: ParentChildDashboard }) {
  const intoLevel = Math.max(0, child.xp) % XP_PER_LEVEL;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{child.nickname}</h2>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<Star className="size-3.5 text-xp" />} label="XP" value={child.xp} />
        <Stat icon={<Trophy className="size-3.5 text-primary" />} label="Level" value={child.level} />
        <Stat icon={<Flame className="size-3.5 text-accent" />} label="Day streak" value={child.streak} />
        <Stat
          icon={<CheckCircle2 className="size-3.5 text-success" />}
          label="Missions"
          value={`${child.missionsCompleted}/${child.totalMissions}`}
        />
        <Stat icon={<Clock className="size-3.5 text-muted-foreground" />} label="Learning time" value={`~${child.learningMinutes} min`} />
        <Stat icon={<GraduationCap className="size-3.5 text-primary" />} label="Concepts" value={child.conceptsLearned.length} />
      </div>

      {/* Progress bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar
            value={child.missionsCompleted}
            max={Math.max(child.totalMissions, 1)}
            tone="success"
            label={`${child.missionsCompleted} of ${child.totalMissions} missions completed`}
            showValue
          />
          <ProgressBar
            value={intoLevel}
            max={XP_PER_LEVEL}
            tone="xp"
            label={`Level ${child.level} · ${XP_PER_LEVEL - intoLevel} XP to level ${child.level + 1}`}
            showValue
          />
        </CardContent>
      </Card>

      {/* Concepts learned */}
      {child.conceptsLearned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-primary" /> Concepts learned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {child.conceptsLearned.map((concept) => (
                <li
                  key={concept}
                  className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                >
                  {concept}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
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
    </section>
  );
}

/**
 * Parent progress view — a focused report of each learner's activity, XP, levels,
 * streaks, and missions. Reads the same server-computed parent dashboard data;
 * the frontend only renders it.
 */
export default function ParentProgressPage() {
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
  useEffect(() => track("progress_viewed"), []);

  return (
    <AppShell experience="parent" items={parentNav} title="Progress">
      <div className="mx-auto max-w-4xl space-y-8">
        {error && <ErrorState title="We couldn't load progress" onRetry={load} />}
        {!error && data === null && <LoadingState label="Loading progress…" />}

        {!error && data && data.children.length === 0 && (
          <EmptyState
            icon={<Users className="size-7" />}
            title="No learners yet"
            description="Add a learner profile, and their activity, XP, and streaks will show up here."
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
          data.children.length > 0 &&
          !data.children.some(hasProgress) && (
            <EmptyState
              icon={<TrendingUp className="size-7" />}
              title="No activity yet"
              description="Once your learners start missions, you'll see their activity, XP, and streaks here."
            />
          )}

        {!error &&
          data &&
          data.children.some(hasProgress) &&
          data.children.map((child) => <ChildProgress key={child.id} child={child} />)}
      </div>
    </AppShell>
  );
}
