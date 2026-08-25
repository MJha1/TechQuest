import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Sticky page header: an optional mobile menu toggle, the page title, and a
 * right slot for contextual controls (XP/Streak chips, avatar, actions).
 */
export function TopBar({
  title,
  right,
  onMenuClick,
  className,
}: {
  title?: ReactNode;
  right?: ReactNode;
  /** When provided, shows a menu button (mobile) that opens the sidebar drawer. */
  onMenuClick?: () => void;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6",
        className,
      )}
    >
      {onMenuClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="lg:hidden"
        >
          <Menu className="size-5" />
        </Button>
      )}
      {title && (
        <h1 className="truncate text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h1>
      )}
      {right && <div className="ml-auto flex items-center gap-2 sm:gap-3">{right}</div>}
    </header>
  );
}
