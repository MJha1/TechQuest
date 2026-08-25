import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import type { BadgeStatus } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { childNav } from "@/lib/nav";
import { listChildBadges } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XPDisplay } from "@/components/XPDisplay";
import { StreakDisplay } from "@/components/StreakDisplay";
import { BadgeList } from "@/components/BadgeList";

/**
 * Child home — the learner's dashboard for the currently active child. Shows the
 * child's XP, level, streak, and badges. The active child is guaranteed present
 * by RequireChild, so this page never re-checks auth.
 */
export default function ChildHomePage() {
  const { activeChild } = useChildContext();
  const child = activeChild!; // guaranteed by RequireChild

  const [badges, setBadges] = useState<BadgeStatus[] | null>(null);
  useEffect(() => {
    let active = true;
    listChildBadges(child.id)
      .then((b) => active && setBadges(b))
      .catch(() => active && setBadges([]));
    return () => {
      active = false;
    };
  }, [child.id]);

  const earnedCount = badges?.filter((b) => b.earned).length ?? 0;

  const sidebarFooter = (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>{child.avatar ?? "🙂"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{child.nickname}</p>
        <p className="text-xs text-muted-foreground">Level {child.level}</p>
      </div>
    </div>
  );

  return (
    <AppShell
      experience="child"
      items={childNav}
      title={`Hi, ${child.nickname}!`}
      sidebarFooter={sidebarFooter}
      topBarRight={
        <>
          <StreakDisplay streak={child.streak} />
          <XPDisplay xp={child.xp} level={child.level} />
        </>
      }
      rightPanel={
        <div className="space-y-4">
          <XPDisplay xp={child.xp} level={child.level} size="large" />
          <StreakDisplay streak={child.streak} size="large" />
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: "var(--font-display)" }}>
              Ready for today's adventure?
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p className="text-muted-foreground">
              Jump into a mission to learn something new and earn XP.
            </p>
            <Button asChild size="lg" variant="accent">
              <Link to="/missions">
                <Compass className="size-4" /> Explore missions
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Reward tiles also shown inline for smaller viewports (no right panel). */}
        <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
          <XPDisplay xp={child.xp} level={child.level} size="large" />
          <StreakDisplay streak={child.streak} size="large" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: "var(--font-display)" }}>
              Badges{badges ? ` (${earnedCount}/${badges.length})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {badges === null ? (
              <p className="text-sm text-muted-foreground">Loading badges…</p>
            ) : (
              <BadgeList badges={badges} />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
