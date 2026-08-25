import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import type { CompleteResult } from "@techquest/shared";
import { useChildContext } from "@/context/ChildContext";
import { childNav } from "@/lib/nav";
import { completeMission } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XPDisplay } from "@/components/XPDisplay";
import { LoadingState } from "@/components/ui/loading-state";

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

  useEffect(() => {
    let active = true;
    completeMission(missionId!, child.id)
      .then((r) => {
        if (active) setResult(r);
        void refresh(); // keep parent-side child totals fresh
      })
      .catch(() => {
        /* leave in loading; the mission list still reflects progress */
      });
    return () => {
      active = false;
    };
  }, [missionId, child.id, refresh]);

  return (
    <AppShell experience="child" items={childNav} title="Mission complete">
      <div className="mx-auto max-w-md">
        {!result ? (
          <LoadingState label="Wrapping up…" />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div
                className="flex size-16 items-center justify-center rounded-full text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-brand)" }}
                aria-hidden
              >
                <PartyPopper className="size-8" />
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Nice work!
              </h2>
              <Badge variant="success">Score {result.score}%</Badge>
              <p className="text-muted-foreground">
                You earned XP and moved closer to the next level.
              </p>
              <XPDisplay xp={result.child.xp} level={result.child.level} size="large" className="w-full" />
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
