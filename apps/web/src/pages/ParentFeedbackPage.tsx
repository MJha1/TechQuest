import { useState } from "react";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { APP_NAME } from "@techquest/shared";
import { parentNav } from "@/lib/nav";
import { submitFeedback } from "@/lib/api";
import { track } from "@/lib/analytics";
import { AppShell } from "@/components/layout/AppShell";
import { SignOutButton } from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** The four simple ratings (value sent to the API → friendly label). */
const RATINGS: { value: string; label: string; emoji: string }[] = [
  { value: "loved_it", label: "Loved it", emoji: "😍" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "okay", label: "Okay", emoji: "😐" },
  { value: "not_useful", label: "Not useful", emoji: "😕" },
];

/**
 * Parent feedback — a deliberately simple form: pick one of four ratings and,
 * optionally, tell us what to improve. No personal information is collected.
 */
export default function ParentFeedbackPage() {
  const [rating, setRating] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!rating) return;
    setSubmitting(true);
    setError(false);
    try {
      await submitFeedback({ rating, comment: comment.trim() || undefined });
      track("feedback_submitted", { rating, hasComment: comment.trim().length > 0 });
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      experience="parent"
      items={parentNav}
      title="Feedback"
      sidebarFooter={<SignOutButton className="w-full" />}
    >
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" /> Share your feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {done ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
                <CheckCircle2 className="size-10 text-success" />
                <p className="font-semibold">Thank you!</p>
                <p className="text-sm text-muted-foreground">Your feedback helps us improve {APP_NAME}.</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-sm font-medium">How is {APP_NAME} working for your family?</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {RATINGS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        aria-pressed={rating === r.value}
                        onClick={() => setRating(r.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors",
                          rating === r.value
                            ? "border-primary bg-secondary ring-2 ring-ring"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        <span className="text-2xl" aria-hidden>{r.emoji}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="comment" className="text-sm font-medium">
                    What should we improve? <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    id="comment"
                    rows={3}
                    maxLength={500}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-md border border-border bg-background p-2 text-sm"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-600">
                    Something went wrong — please try again.
                  </p>
                )}

                <Button onClick={handleSubmit} disabled={!rating || submitting} className="w-full">
                  {submitting ? "Sending…" : "Send feedback"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
