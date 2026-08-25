import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { childNav } from "@/lib/nav";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Mission detail. Reads the :missionId route param; the mission player (steps,
 * scoring, XP) is not built yet, so this is a routing placeholder that links on
 * to the completion route.
 */
export default function MissionDetailPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();

  return (
    <AppShell experience="child" items={childNav} title="Mission">
      <div className="mx-auto max-w-2xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/missions">
            <ArrowLeft className="size-4" /> All missions
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: "var(--font-display)" }}>
              Mission: {missionId}
            </CardTitle>
            <CardDescription>
              The mission player is coming soon. This screen wires the route.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/missions/${missionId}/complete`)}>
              <CheckCircle2 className="size-4" /> Complete mission
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
