import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Users, UserPlus, Clock, GraduationCap } from "lucide-react";
import type { ParentChildDashboard, ParentDashboard } from "@techquest/shared";
import { parentNav } from "@/lib/nav";
import { getParentDashboard } from "@/lib/api";
import { track } from "@/lib/analytics";
import { AppShell } from "@/components/layout/AppShell";
import { SignOutButton } from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressMeters } from "@/components/parent/ProgressMeters";
import { WeeklyActivity } from "@/components/parent/WeeklyActivity";
import { ConceptChips } from "@/components/parent/ConceptChips";
import { ActivityTimeline } from "@/components/parent/ActivityTimeline";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

/** A child has something worth reporting once they've earned XP, completed a
 * mission, or generated any activity. */
function hasProgress(child: ParentChildDashboard): boolean {
  return child.xp > 0 || child.missionsCompleted > 0 || child.recentActivity.length > 0;
}

/**
 * One child's progress report: the same visual meters as the dashboard — but
 * with the rings sweeping in and the numbers counting up (`animate`) — plus a
 * weekly activity strip, the concepts explored, and an activity timeline.
 */
function ChildProgress({ child }: { child: ParentChildDashboard }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{child.nickname}</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ProgressMeters child={child} animate />
          <WeeklyActivity activity={child.recentActivity} />
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
            <ConceptChips concepts={child.conceptsLearned} />
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
          <ActivityTimeline activity={child.recentActivity} />
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
    <AppShell
      experience="parent"
      items={parentNav}
      title="Progress"
      sidebarFooter={<SignOutButton className="w-full" />}
    >
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
