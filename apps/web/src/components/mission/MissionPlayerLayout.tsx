import type { ReactNode } from "react";
import { X } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { XPDisplay } from "@/components/XPDisplay";
import { Button } from "@/components/ui/button";

/**
 * Focused mission-player shell, optimized for 1440×900. Unlike the app-wide
 * AppShell (with its sidebar), this is a distraction-free, full-viewport frame:
 *
 *   ┌───────────────────────────────────────────────┐
 *   │ Top:    title · progress · XP           [exit] │
 *   ├──────────────────────────────┬────────────────┤
 *   │ Center: current activity     │ Side (optional)│
 *   │         (scrolls)            │  learn / hint  │
 *   ├──────────────────────────────┴────────────────┤
 *   │ Bottom: Back · [next hint] · Continue          │
 *   └───────────────────────────────────────────────┘
 *
 * Purely presentational — the page supplies content and controls.
 */
export function MissionPlayerLayout({
  title,
  stepIndex,
  stepCount,
  xp,
  level,
  onExit,
  side,
  footer,
  children,
}: {
  title: string;
  stepIndex: number;
  stepCount: number;
  xp: number;
  level: number;
  onExit: () => void;
  side?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const stepNumber = Math.min(stepIndex + 1, stepCount);

  return (
    <div data-experience="child" className="flex h-screen flex-col bg-background text-foreground">
      {/* Top */}
      <header className="flex items-center gap-4 border-b border-border px-6 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <ProgressBar
              value={stepCount ? (stepNumber / stepCount) * 100 : 0}
              className="max-w-xs"
            />
            <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
              Step {stepNumber} of {stepCount}
            </span>
          </div>
        </div>
        <XPDisplay xp={xp} level={level} />
        <Button variant="ghost" size="icon" aria-label="Exit mission" onClick={onExit}>
          <X className="size-5" />
        </Button>
      </header>

      {/* Center + optional side panel */}
      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[1fr_20rem]">
        <main className="overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-2xl">{children}</div>
        </main>
        {side && (
          <aside className="hidden overflow-y-auto border-l border-border bg-card px-5 py-8 xl:block">
            {side}
          </aside>
        )}
      </div>

      {/* Bottom */}
      <footer className="border-t border-border px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 xl:max-w-none xl:pr-[20rem]">
          {footer}
        </div>
      </footer>
    </div>
  );
}
