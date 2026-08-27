import { useEffect, useState } from "react";
import { Trophy, Map as MapIcon, Flame, Sparkles, Check } from "lucide-react";
import type { FamilyLeaderboard, LeaderboardEntry, LeaderboardMission } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { childNav } from "@/lib/nav";
import { getFamilyLeaderboard } from "@/lib/api";
import { useCachedResource } from "@/lib/useCachedResource";
import { missionTheme } from "@/lib/missionTheme";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarBuddy } from "@/components/child/SidebarBuddy";
import { XPDisplay } from "@/components/XPDisplay";
import { StreakDisplay } from "@/components/StreakDisplay";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState, CHILD_ERROR } from "@/components/ui/error-state";

/** Medal for the top three; a plain rank pill otherwise. */
const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

type View = "ranking" | "missions";

/**
 * Child "Group" page — a friendly family leaderboard among a learner's siblings.
 *
 * Two toggleable views: a positive Ranking (medals for the top few, the child's
 * own row highlighted, no "last place" framing) and a Missions board showing who
 * has completed which mission. Data is server-computed and scoped to the child's
 * own parent; only nicknames, preset avatars, and gameplay stats are shown.
 */
export default function GroupPage() {
  const { activeChild } = useChildContext();
  const child = activeChild!; // guaranteed by RequireChild
  const [view, setView] = useState<View>("ranking");

  const res = useCachedResource(`child-leaderboard:${child.id}`, () => getFamilyLeaderboard(child.id));
  const board = res.data ?? null;

  useEffect(() => track("group_viewed", { childRef: child.id }), [child.id]);

  return (
    <AppShell
      experience="child"
      items={childNav}
      title="Our Group 🏆"
      sidebarExtra={<SidebarBuddy nickname={child.nickname} level={child.level} xp={child.xp} />}
      topBarRight={
        <>
          <StreakDisplay streak={child.streak} />
          <XPDisplay xp={child.xp} level={child.level} />
        </>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {board === null && !res.error && <LoadingState label="Loading your group…" />}
        {res.error && (
          <ErrorState title={CHILD_ERROR.title} description={CHILD_ERROR.description} onRetry={res.reload} />
        )}

        {board && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-medium">
                See how your team is doing — cheer each other on! 🎉
              </p>
              <ViewToggle view={view} onChange={setView} />
            </div>

            {view === "ranking" ? (
              <RankingView board={board} />
            ) : (
              <MissionsBoard board={board} />
            )}

            {board.entries.length < 2 && <SoloNote />}
          </>
        )}
      </div>
    </AppShell>
  );
}

/** Segmented Ranking / Missions switch. */
function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const tabs: { id: View; label: string; icon: typeof Trophy }[] = [
    { id: "ranking", label: "Ranking", icon: Trophy },
    { id: "missions", label: "Missions", icon: MapIcon },
  ];
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1" role="tablist" aria-label="Group view">
      {tabs.map((t) => {
        const active = view === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden /> {t.label}
          </button>
        );
      })}
    </div>
  );
}

/** The ranked standings. Positive by design: medals up top, your row lit. */
function RankingView({ board }: { board: FamilyLeaderboard }) {
  const topXp = Math.max(1, ...board.entries.map((e) => e.xp));
  const many = board.entries.length > 1;
  return (
    <ul className="space-y-3">
      {board.entries.map((e, i) => (
        <li key={e.id} className="animate-card-flip-in" style={{ animationDelay: `${i * 70}ms` }}>
          <RankRow entry={e} topXp={topXp} showMedal={many} />
        </li>
      ))}
    </ul>
  );
}

function RankRow({
  entry,
  topXp,
  showMedal,
}: {
  entry: LeaderboardEntry;
  topXp: number;
  showMedal: boolean;
}) {
  const medal = showMedal ? MEDALS[entry.rank] : undefined;
  const pct = Math.round((entry.xp / topXp) * 100);
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border-2 p-4 transition-colors",
        entry.isCurrent ? "border-primary bg-primary/5 shadow-sm" : "border-border",
      )}
    >
      <div className="flex w-8 shrink-0 justify-center text-2xl font-bold" aria-hidden>
        {medal ?? <span className="text-base text-muted-foreground">{entry.rank}</span>}
      </div>
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl"
        aria-hidden
      >
        {entry.avatar ?? "🙂"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-bold">
          <span className="truncate">{entry.nickname}</span>
          {entry.isCurrent && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              You
            </span>
          )}
        </p>
        {/* XP bar — relative to the group leader. */}
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-xp transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-xp-foreground">
            <Sparkles className="size-3.5 text-xp" aria-hidden /> {entry.xp.toLocaleString()} XP · Lv {entry.level}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="size-3.5 text-primary" aria-hidden /> {entry.missionsCompleted} missions
          </span>
          {entry.streak > 0 && (
            <span className="inline-flex items-center gap-1 text-streak">
              <Flame className="size-3.5" aria-hidden /> {entry.streak}-day streak
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Who has completed which mission — a compact matrix of learners × missions. */
function MissionsBoard({ board }: { board: FamilyLeaderboard }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-secondary/50">
            <th className="sticky left-0 z-10 bg-secondary/50 p-3 text-left font-semibold">Learner</th>
            {board.missions.map((m) => (
              <MissionHeader key={m.id} mission={m} />
            ))}
          </tr>
        </thead>
        <tbody>
          {board.entries.map((e) => {
            const done = new Set(e.completedMissionIds);
            return (
              <tr key={e.id} className={cn("border-t border-border", e.isCurrent && "bg-primary/5")}>
                <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="text-lg" aria-hidden>{e.avatar ?? "🙂"}</span>
                    <span className="truncate">{e.nickname}</span>
                    {e.isCurrent && <span className="text-xs text-primary">(You)</span>}
                  </span>
                </th>
                {board.missions.map((m) => {
                  const complete = done.has(m.id);
                  return (
                    <td key={m.id} className="p-3 text-center">
                      {complete ? (
                        <span
                          className="inline-flex size-8 items-center justify-center rounded-full bg-success/15 text-success animate-pop"
                          title={`${e.nickname} completed “${m.title}”`}
                        >
                          <Check className="size-4" aria-hidden />
                          <span className="sr-only">Completed</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground/50"
                          title={`Not yet: “${m.title}”`}
                        >
                          <span aria-hidden>·</span>
                          <span className="sr-only">Not yet</span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MissionHeader({ mission }: { mission: LeaderboardMission }) {
  const theme = missionTheme(mission.slug);
  return (
    <th className="p-3 text-center font-semibold" title={mission.title}>
      <span
        className="mx-auto flex size-9 items-center justify-center rounded-xl text-xl text-primary-foreground"
        style={{ backgroundImage: theme.gradient }}
        aria-hidden
      >
        {theme.emoji}
      </span>
      <span className="sr-only">{mission.title}</span>
    </th>
  );
}

/** Shown when a learner has no siblings yet — keeps it warm, teases Circles. */
function SoloNote() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5 text-center text-sm text-muted-foreground">
      <p className="text-2xl" aria-hidden>🚀</p>
      <p className="mt-1 font-medium text-foreground">You&apos;re flying solo right now!</p>
      <p className="mt-0.5">Learning buddies from your family and friends are coming soon — keep earning XP!</p>
    </div>
  );
}
