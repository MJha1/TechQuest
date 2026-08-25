import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Encouraging empty state — icon/illustration, a headline, a short line, and an
 * optional primary action. Designed to feel inviting, not like a dead end.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card p-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-3xl text-secondary-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
