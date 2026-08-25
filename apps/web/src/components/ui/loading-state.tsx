import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Inline/section loading indicator with an accessible label. */
export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground", className)}
    >
      <Loader2 className="size-6 animate-spin-slow" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Content placeholder shown while data loads (no spinner). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} aria-hidden />;
}
