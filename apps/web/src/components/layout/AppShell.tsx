import { useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ExitToParentButton } from "@/components/ExitToParentButton";
import type { NavItem } from "@/components/Navigation";

/**
 * Application shell: a fixed left sidebar, a scrollable main content area, and
 * an optional right contextual panel. Desktop-first (primary 1440×900) and
 * responsive: below `lg` the sidebar collapses into an accessible slide-over
 * drawer opened from the top bar's menu button.
 *
 * `experience` sets the design-token scope ("child" is rounder/energetic,
 * "parent" is calmer). The shell holds no business logic.
 */
export function AppShell({
  items,
  title,
  topBarRight,
  sidebarFooter,
  rightPanel,
  experience = "child",
  children,
}: {
  items: NavItem[];
  title?: ReactNode;
  topBarRight?: ReactNode;
  sidebarFooter?: ReactNode;
  rightPanel?: ReactNode;
  experience?: "child" | "parent";
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // In the child space, always offer a way back to the parent area (where the
  // account controls, incl. sign-out, live), alongside any page-specific controls.
  const topRight =
    experience === "child" ? (
      <>
        <ExitToParentButton />
        {topBarRight}
      </>
    ) : (
      topBarRight
    );

  return (
    <div data-experience={experience} className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar (fixed column) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64">
        <Sidebar items={items} footer={sidebarFooter} />
      </aside>

      {/* Mobile sidebar (slide-over drawer, focus-trapped) */}
      <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 animate-fade-in lg:hidden" />
          <DialogPrimitive.Content
            className="fixed inset-y-0 left-0 z-50 w-72 focus:outline-none lg:hidden"
            aria-label="Navigation"
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <Sidebar
              items={items}
              footer={sidebarFooter}
              onNavigate={() => setDrawerOpen(false)}
              className="h-full"
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Main column */}
      <div className="lg:pl-64">
        <TopBar title={title} right={topRight} onMenuClick={() => setDrawerOpen(true)} />
        <div className="flex">
          <main className={cn("min-w-0 flex-1 p-4 sm:p-6")}>{children}</main>
          {rightPanel && (
            <aside className="hidden w-80 shrink-0 border-l border-border p-6 xl:block">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
