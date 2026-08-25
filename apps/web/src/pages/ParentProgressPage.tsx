import { useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { parentNav } from "@/lib/nav";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/empty-state";
import { track } from "@/lib/analytics";

/**
 * Parent progress view. Placeholder shell — progress reporting is added once
 * mission functionality exists. No business logic here yet.
 */
export default function ParentProgressPage() {
  useEffect(() => track("progress_viewed"), []);

  return (
    <AppShell experience="parent" items={parentNav} title="Progress">
      <div className="mx-auto max-w-4xl">
        <EmptyState
          icon={<TrendingUp className="size-7" />}
          title="Progress reports are coming soon"
          description="Once your learners start missions, you'll see their activity, XP, and streaks here."
        />
      </div>
    </AppShell>
  );
}
