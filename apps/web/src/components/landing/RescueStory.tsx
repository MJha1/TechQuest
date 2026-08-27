import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { APP_NAME } from "@techquest/shared";
import { buttonVariants } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { RobotMascot } from "@/components/landing/illustrations";
import worriedParent from "@/assets/worried-parent.png";

/**
 * A little "to the rescue" story for the landing page: a worried parent
 * wondering how their child will ever learn AI, and TechQuest arriving to help.
 * The worry is a full scene image; the rescue is the inline SVG mascot. Warmly
 * personalized with the signed-in parent's first name when we have it.
 */
export function RescueStory({
  signedIn,
  firstName,
}: {
  signedIn: boolean;
  firstName: string | null;
}) {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
      {/* The worry — a full scene: the questions and the "how will my child
          learn it?" note are baked into the image, so no extra thought bubble. */}
      <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
        <img
          src={worriedParent}
          alt="A parent at a laptop, worried about how their child will learn AI while the child uses a tablet nearby."
          className="mx-auto w-full rounded-xl shadow-md"
        />
        <p className="mt-3 text-sm text-muted-foreground">Every parent, right about now.</p>
      </div>

      {/* Connector: → on desktop, ↓ on mobile */}
      <div
        className="mx-auto flex size-11 items-center justify-center rounded-full text-primary-foreground shadow-md animate-float"
        style={{ backgroundImage: "var(--gradient-brand)" }}
        aria-hidden
      >
        <ArrowRight className="size-5 rotate-90 lg:rotate-0" />
      </div>

      {/* The rescue */}
      <div
        className="relative overflow-hidden rounded-2xl border border-primary/20 p-6 text-center shadow-sm"
        style={{ background: "color-mix(in srgb, var(--color-primary) 8%, var(--color-card))" }}
      >
        <span className="pointer-events-none absolute right-4 top-3 animate-float text-2xl" aria-hidden>✨</span>
        <span className="pointer-events-none absolute bottom-3 left-4 animate-float text-xl" style={{ animationDelay: "0.9s" }} aria-hidden>🚀</span>

        <div className="mx-auto w-28">
          <RobotMascot className="w-full animate-float" />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">
          Here&apos;s the fix
        </p>
        <h3 className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {signedIn && firstName ? `Breathe easy, ${firstName}.` : "Breathe easy."}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
          We turn big AI ideas into short, playful missions — and you stay in control the whole way.
        </p>
        <div className="mt-5">
          {signedIn ? (
            <Link
              to="/parent"
              onClick={() => track("cta_clicked", { cta: "rescue_dashboard" })}
              className={cn(buttonVariants({ size: "sm" }), "gap-2")}
            >
              Jump back in <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link
              to="/signup"
              onClick={() => track("cta_clicked", { cta: "rescue" })}
              className={cn(buttonVariants({ variant: "accent", size: "sm" }), "gap-2")}
            >
              Try {APP_NAME} <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
