import { Link } from "react-router-dom";
import { Rocket, Check } from "lucide-react";
import { APP_NAME } from "@techquest/shared";
import { cn } from "@/lib/utils";

/**
 * Shared shell for the parent onboarding flow (Signup → Create Child).
 *
 * It gives every step the same frame: brand, a two-step progress indicator, and
 * a calm "aside" panel that reminds the parent what TechQuest is, who it's for,
 * what their child will do, and why it matters — so the value proposition is
 * reinforced through the flow without cluttering the form itself.
 */

/** The onboarding steps, in order. Landing is step 0 (pre-account). */
export const ONBOARDING_STEPS = ["Create account", "Add your child"] as const;

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Onboarding progress">
      {ONBOARDING_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-primary text-primary-foreground",
                active && "border-2 border-primary text-primary",
                !done && !active && "border border-border text-muted-foreground",
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < ONBOARDING_STEPS.length - 1 && (
              <span className="mx-1 h-px w-6 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function OnboardingLayout({
  step,
  title,
  subtitle,
  aside,
  children,
}: {
  /** Zero-based index into ONBOARDING_STEPS. */
  step: number;
  title: string;
  subtitle?: string;
  /** The reassurance panel content (what/who/why for this step). */
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main
      data-experience="parent"
      className="grid min-h-screen lg:grid-cols-[1fr_minmax(0,26rem)]"
    >
      {/* Form column */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Link to="/" className="flex items-center gap-2 font-bold" style={{ fontFamily: "var(--font-display)" }}>
          <span
            className="flex size-8 items-center justify-center rounded-lg text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-brand)" }}
            aria-hidden
          >
            <Rocket className="size-4" />
          </span>
          {APP_NAME}
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <Stepper current={step} />
          <div className="mt-8 space-y-1">
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {title}
            </h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Aside — reinforces the value proposition (desktop only). */}
      <aside
        className="hidden flex-col justify-center gap-6 px-10 text-primary-foreground lg:flex"
        style={{ backgroundImage: "var(--gradient-brand)" }}
      >
        {aside}
      </aside>
    </main>
  );
}
