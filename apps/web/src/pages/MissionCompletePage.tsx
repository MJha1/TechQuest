import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import type { CompleteResult } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { childNav } from "@/lib/nav";
import { completeMission } from "@/lib/api";
import { track } from "@/lib/analytics";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Confetti } from "@/components/ui/confetti";
import { ProgressBar } from "@/components/ui/progress-bar";
import { XPDisplay } from "@/components/XPDisplay";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState, CHILD_ERROR } from "@/components/ui/error-state";

/** Humanize a badge slug for display (e.g. "first-explorer" → "First Explorer"). */
function badgeLabel(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Mission complete — finalizes the mission via the (idempotent) complete
 * endpoint and celebrates the result. Because completion is idempotent, landing
 * here (or refreshing) never double-awards XP.
 */
export default function MissionCompletePage() {
  const { missionId } = useParams<{ missionId: string }>();
  const { activeChild, refresh } = useChildContext();
  const child = activeChild!;
  const [result, setResult] = useState<CompleteResult | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    setResult(null);
    completeMission(missionId!, child.id)
      .then((r) => {
        if (!active) return;
        setResult(r);
        // Fire once — completion is idempotent, so skip when already recorded.
        if (!r.alreadyCompleted) {
          track("mission_completed", {
            childRef: child.id,
            missionSlug: r.missionSlug,
            score: r.score,
          });
          for (const badgeSlug of r.badges) {
            track("badge_earned", { childRef: child.id, badgeSlug });
          }
        }
        void refresh(); // keep parent-side child totals fresh
      })
      .catch(() => {
        // Never strand the child on a spinner — show a friendly retry instead.
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [missionId, child.id, refresh, attempt]);

  return (
    <AppShell experience="child" items={childNav} title="Mission complete">
      <div className="mx-auto max-w-md">
        {error ? (
          <ErrorState
            title={CHILD_ERROR.title}
            description={CHILD_ERROR.description}
            onRetry={() => setAttempt((a) => a + 1)}
          />
        ) : !result ? (
          <LoadingState label="Wrapping up…" />
        ) : (
          <Card className="relative">
            {/* Celebrate a fresh completion (not a refresh of an already-done one). */}
            <Confetti trigger={result.alreadyCompleted ? 0 : 1} pieces={28} />
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div
                className="flex size-16 animate-pop items-center justify-center rounded-full text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-brand)" }}
                aria-hidden
              >
                <PartyPopper className="size-8 animate-float" />
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Nice work! 🎉
              </h2>
              <Badge variant="success">Score {result.score}%</Badge>
              <p className="text-muted-foreground">
                You earned XP and moved closer to the next level.
              </p>
              <XPDisplay xp={result.child.xp} level={result.child.level} size="large" className="w-full" />
              <div className="w-full">
                <ProgressBar
                  value={result.child.xp % 100}
                  max={100}
                  tone="xp"
                  label={`Level ${result.child.level} · ${100 - (result.child.xp % 100)} XP to level ${result.child.level + 1}`}
                  showValue
                />
              </div>

              {result.badges.length > 0 && (
                <div className="w-full rounded-xl border border-xp/40 bg-xp/10 p-4">
                  <p className="text-sm font-semibold text-xp-foreground">
                    {result.badges.length === 1 ? "New badge unlocked!" : "New badges unlocked!"}
                  </p>
                  <ul className="mt-2 flex flex-wrap justify-center gap-2">
                    {result.badges.map((slug, i) => (
                      <li
                        key={slug}
                        className="flex animate-pop items-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm font-medium shadow-sm"
                        style={{ animationDelay: `${120 + i * 90}ms` }}
                      >
                        <span aria-hidden>🏅</span> {badgeLabel(slug)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/child">Home</Link>
                </Button>
                <Button asChild>
                  <Link to="/missions">More missions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
