import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Rocket, Shield, Sparkles, ArrowRight } from "lucide-react";
import { APP_NAME } from "@techquest/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { RobotMascot, EmojiTile } from "@/components/landing/illustrations";
import { TryMission } from "@/components/landing/TryMission";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession } from "@/lib/auth-client";

/** Fire cta_clicked, then let the (Link) navigation proceed. */
const onCta = (cta: string) => () => track("cta_clicked", { cta });

/**
 * Friendly first name from the account's display name. Signup derives that name
 * from the email local-part (no real name is collected), so we take the first
 * segment and capitalize it — a warm, non-identifying greeting for the parent's
 * own device.
 */
function firstNameFrom(name: string): string {
  const seg = name.trim().split(/[.\-_+\s]/)[0] || name.trim();
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

/** Small gradient avatar showing the parent's initial (matches the app chrome). */
function InitialAvatar({ initial, className }: { initial: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-6 items-center justify-center rounded-full text-xs font-bold text-primary-foreground",
        className,
      )}
      style={{ backgroundImage: "var(--gradient-brand)" }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function seeHowItWorks() {
  track("cta_clicked", { cta: "see_how_it_works" });
  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
}

function Section({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-5xl px-6 py-14", className)}>
      {eyebrow && (
        <p className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
      )}
      <h2
        className="text-center text-3xl font-bold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/**
 * Parent-facing landing page — visual-first. Big illustrations, emoji tiles, and
 * a live tappable mission carry the message so a parent (or a curious child)
 * grasps it at a glance, with minimal reading. Copy stays truthful: no invented
 * stats, logos, or testimonials.
 */
export default function LandingPage() {
  useEffect(() => track("landing_viewed"), []);

  // Personalization: greet a returning/signed-in parent by name (from their live
  // session cookie — no extra storage). Anonymous visitors see the default copy.
  const { data: session, isPending } = useSession();
  const signedIn = !!session?.user && !isPending;
  const firstName = session?.user?.name ? firstNameFrom(session.user.name) : null;
  const initial = firstName ? firstName.charAt(0).toUpperCase() : "P";

  return (
    <div data-experience="parent" className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="flex items-center gap-2 font-bold" style={{ fontFamily: "var(--font-display)" }}>
          <span
            className="flex size-8 items-center justify-center rounded-lg text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-brand)" }}
            aria-hidden
          >
            <Rocket className="size-4" />
          </span>
          {APP_NAME}
        </span>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Link
              to="/parent"
              onClick={onCta("header_dashboard")}
              className={cn(buttonVariants({ size: "sm" }), "gap-2")}
            >
              <InitialAvatar initial={initial} className="size-5" />
              Continue as {firstName}
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Parent log in
              </Link>
              <Link to="/signup" onClick={onCta("header")} className={buttonVariants({ size: "sm" })}>
                Try {APP_NAME}
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero — text + mascot */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-10 pt-6 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          {signedIn ? (
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <span aria-hidden>👋</span> Welcome back, {firstName}!
            </p>
          ) : (
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <Sparkles className="size-4 text-primary" /> For curious kids, aged 8–12
            </p>
          )}
          <h1
            className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Become <span className="text-primary">AI-ready</span> through play.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {signedIn
              ? "Your learners are waiting — jump back in where they left off."
              : "Big ideas about AI → short, playful missions. Parents stay in control."}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            {signedIn ? (
              <Button asChild size="lg">
                <Link to="/parent" onClick={onCta("hero_dashboard")}>
                  Go to your dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="accent">
                <Link to="/signup" onClick={onCta("hero")}>
                  Try {APP_NAME} <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={seeHowItWorks}>
              See how it works
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {signedIn ? `Signed in as ${firstName}` : "Free to start · No child logins"}
          </p>
        </div>

        {/* Mascot with floating emoji */}
        <div className="relative mx-auto w-full max-w-sm">
          <RobotMascot className="w-full" />
          <span className="absolute left-2 top-6 animate-float text-3xl" style={{ animationDelay: "0.3s" }} aria-hidden>🚀</span>
          <span className="absolute right-3 top-16 animate-float text-3xl" style={{ animationDelay: "1s" }} aria-hidden>🧩</span>
          <span className="absolute bottom-6 left-6 animate-float text-3xl" style={{ animationDelay: "1.6s" }} aria-hidden>💡</span>
        </div>
      </section>

      {/* How it works — visual steps */}
      <Section id="how-it-works" eyebrow="How it works" title={`${APP_NAME} in 4 steps`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { emoji: "🧑‍🚀", label: "Make a profile", caption: "Nickname + age. No logins." },
            { emoji: "🎮", label: "Play missions", caption: "5–10 min, playful." },
            { emoji: "🧠", label: "Learn AI", caption: "How it really works." },
            { emoji: "👀", label: "Parents follow", caption: "See every step." },
          ].map((s, i) => (
            <Card key={s.label} interactive className="group relative">
              <CardContent className="p-5 text-center">
                <span className="absolute right-3 top-3 text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <EmojiTile
                  emoji={s.emoji}
                  label={s.label}
                  caption={s.caption}
                  className="[&>span]:inline-block [&>span]:transition-transform [&>span]:duration-200 group-hover:[&>span]:scale-125"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Interactive sample mission */}
      <div className="bg-muted/40">
        <Section eyebrow="Try it now" title="Tap a real mission">
          <div className="mx-auto max-w-2xl">
            <TryMission />
          </div>
        </Section>
      </div>

      {/* What children learn — emoji chips */}
      <Section eyebrow="What kids learn" title="Real ideas, one mission at a time">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { emoji: "🤖", label: "How AI learns" },
            { emoji: "📺", label: "Why apps suggest" },
            { emoji: "⚠️", label: "AI can be wrong" },
            { emoji: "🪜", label: "Step-by-step code" },
            { emoji: "🦾", label: "How robots think" },
            { emoji: "💡", label: "Design your own" },
          ].map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <span className="text-3xl" aria-hidden>{c.emoji}</span>
              <span className="text-sm font-semibold">{c.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* What parents see — emoji cards */}
      <div className="bg-muted/40">
        <Section eyebrow="For parents" title="What you'll see">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { emoji: "📈", label: "Progress", caption: "Level, streak, missions." },
              { emoji: "🧠", label: "What they learned", caption: "Plain-language recaps." },
              { emoji: "💬", label: "Talk at home", caption: "Simple prompts." },
              { emoji: "🏆", label: "Badges", caption: "Rewards for real progress." },
            ].map((p) => (
              <Card key={p.label} interactive>
                <CardContent className="p-5 text-center">
                  <EmojiTile emoji={p.emoji} label={p.label} caption={p.caption} />
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      {/* Safety & privacy — chips */}
      <Section eyebrow="Safe & private" title="Safe by design">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { emoji: "🚫", text: "No child logins" },
            { emoji: "🙈", text: "No real names or photos" },
            { emoji: "🤖", text: "Bounded AI — never an open chatbot" },
            { emoji: "👨‍👩‍👧", text: "Parents create the account & stay in control" },
          ].map((s) => (
            <div key={s.text} className="flex items-center gap-3 rounded-xl border border-border p-4">
              <span className="text-2xl" aria-hidden>{s.emoji}</span>
              <span className="text-sm font-medium">{s.text}</span>
              <Shield className="ml-auto size-4 shrink-0 text-success" aria-hidden />
            </div>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <div
          className="relative overflow-hidden rounded-2xl px-8 py-12 text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-brand)" }}
        >
          <span className="absolute right-6 top-4 animate-float text-4xl opacity-90" aria-hidden>🤖</span>
          <span className="absolute bottom-4 left-6 animate-float text-3xl opacity-90" style={{ animationDelay: "1s" }} aria-hidden>✨</span>
          <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Ready to start?
          </h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">Free to start · You stay in control.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              onClick={onCta("final")}
              className={cn(buttonVariants({ size: "lg" }), "bg-background text-foreground hover:bg-background/90")}
            >
              Try {APP_NAME} <ArrowRight className="size-4" />
            </Link>
            <Button
              variant="ghost"
              size="lg"
              onClick={seeHowItWorks}
              className="text-primary-foreground hover:bg-white/15"
            >
              See how it works
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>{APP_NAME} — technology & AI learning for kids 8–12.</span>
          <Link to="/login" className="underline">Parent log in</Link>
        </div>
      </footer>
    </div>
  );
}
