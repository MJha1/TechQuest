import type { ElementType, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon?: ElementType;
  /** Optional trailing element (e.g. a count Badge). */
  badge?: ReactNode;
  /** Match the path exactly (react-router NavLink `end`). */
  end?: boolean;
}

/**
 * Primary navigation list. Uses NavLink so the active route is highlighted
 * automatically. Rendered inside the Sidebar (desktop column + mobile drawer).
 */
export function Navigation({
  items,
  onNavigate,
  className,
}: {
  items: NavItem[];
  /** Called after a link is clicked — used to close the mobile drawer. */
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Primary">
      {items.map(({ to, label, icon: Icon, badge, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          {Icon && <Icon className="size-5 shrink-0" aria-hidden />}
          <span className="flex-1 truncate">{label}</span>
          {badge}
        </NavLink>
      ))}
    </nav>
  );
}
