import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Play, Users } from "lucide-react";
import type { Child } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { parentNav } from "@/lib/nav";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Parent dashboard — overview of the parent's learners and the entry point into
 * a child's learning space. Selecting "Enter" sets the active child context and
 * routes to the child home; this is the one place a child context is chosen.
 */
export default function ParentDashboardPage() {
  const { status, children, setActiveChild, refresh } = useChildContext();
  const navigate = useNavigate();

  // Ensure the list is current (e.g. right after adding a child).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  function enter(child: Child) {
    setActiveChild(child);
    navigate("/child");
  }

  return (
    <AppShell experience="parent" items={parentNav} title="Dashboard">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your learners</h2>
          <Button asChild size="sm">
            <Link to="/create-child">
              <UserPlus className="size-4" /> Add learner
            </Link>
          </Button>
        </div>

        {status === "loading" && <LoadingState label="Loading learners…" />}
        {status === "error" && <ErrorState onRetry={() => void refresh()} />}

        {status === "ready" && children.length === 0 && (
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

        {status === "ready" && children.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <li key={child.id}>
                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <Avatar size="lg">
                      <AvatarFallback>{child.avatar ?? "🙂"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{child.nickname}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant="secondary">Level {child.level}</Badge>
                        <Badge variant="xp">{child.xp} XP</Badge>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => enter(child)}>
                      <Play className="size-4" /> Enter
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
