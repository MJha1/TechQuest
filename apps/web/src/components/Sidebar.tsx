import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { APP_NAME } from "@techquest/shared";
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navigation, type NavItem } from "./Navigation";

/**
 * Left sidebar: brand mark, primary navigation, and an optional footer slot
 * (e.g. the active learner or a parent-settings link). Fills its container's
 * height; AppShell places it as a fixed column on desktop and inside a drawer
 * on mobile.
 */
export function Sidebar({
  items,
  footer,
  onNavigate,
  className,
}: {
  items: NavItem[];
  footer?: ReactNode;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full flex-col gap-6 border-r border-border bg-card p-4", className)}>
      <Link to="/" className="flex items-center gap-2 px-2" onClick={onNavigate}>
        <span
          className="flex size-9 items-center justify-center rounded-xl text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-brand)" }}
          aria-hidden
        >
          <Rocket className="size-5" />
        </span>
        <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {APP_NAME}
        </span>
      </Link>

      <Navigation items={items} onNavigate={onNavigate} className="flex-1" />

      {footer && <div className="border-t border-border pt-4">{footer}</div>}
    </div>
  );
}
