import { MessageSquare } from "lucide-react";
import { parentNav } from "@/lib/nav";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Parent feedback view. Placeholder shell — AI feedback surfaces here later. No
 * business logic yet.
 */
export default function ParentFeedbackPage() {
  return (
    <AppShell experience="parent" items={parentNav} title="Feedback">
      <div className="mx-auto max-w-4xl">
        <EmptyState
          icon={<MessageSquare className="size-7" />}
          title="No feedback yet"
          description="Encouraging, age-appropriate feedback about your learners will appear here."
        />
      </div>
    </AppShell>
  );
}
