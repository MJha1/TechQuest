import { Link, useParams } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import { useChildContext } from "@/context/ChildContext";
import { childNav } from "@/lib/nav";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XPDisplay } from "@/components/XPDisplay";

/**
 * Mission complete — celebratory placeholder. Reads :missionId; XP/streak
 * awarding logic is not implemented yet, so the numbers shown are the child's
 * current totals, not a computed reward.
 */
export default function MissionCompletePage() {
  const { missionId } = useParams<{ missionId: string }>();
  const { activeChild } = useChildContext();
  const child = activeChild!;

  return (
    <AppShell experience="child" items={childNav} title="Mission complete">
      <div className="mx-auto max-w-md">
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
            <p className="text-muted-foreground">
              You finished the mission <span className="font-medium">{missionId}</span>.
            </p>
            <XPDisplay xp={child.xp} level={child.level} size="large" className="w-full" />
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
      </div>
    </AppShell>
  );
}
