import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Rocket,
  Compass,
  Brain,
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  MessageCircleQuestion,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { APP_NAME } from "@techquest/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const CORE_MESSAGE = "Help your child become AI-ready by learning through play and building.";

/** Fire cta_clicked, then let the (Link) navigation proceed. */
const onCta = (cta: string) => () => track("cta_clicked", { cta });

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
    <section id={id} className={cn("mx-auto max-w-5xl px-6 py-16", className)}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * Parent-facing marketing landing page. Desktop-first. The hero states the core
 * value proposition so a parent understands it within ~30 seconds; the sections
 * below build trust with concrete, truthful detail (no invented stats, logos,
 * or testimonials).
 */
export default function LandingPage() {
  useEffect(() => track("landing_viewed"), []);

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
          <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Log in
          </Link>
          <Link
            to="/signup"
            onClick={onCta("header")}
            className={buttonVariants({ size: "sm" })}
          >
            Try {APP_NAME}
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-10 text-center">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
          <Sparkles className="size-4 text-primary" /> For curious kids, aged 8–12
        </p>
        <h1
          className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {CORE_MESSAGE}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          {APP_NAME} turns big ideas about AI and technology into short, playful missions — so
          children build real understanding and confidence, with parents in control.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="accent">
            <Link to="/signup" onClick={onCta("hero")}>
              Try {APP_NAME} <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={seeHowItWorks}>
            See how it works
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Free to start · No child logins</p>
      </section>

      {/* Problem */}
      <div className="bg-muted/40">
        <Section eyebrow="The problem" title="Kids use technology every day — but rarely understand it">
          <p className="max-w-2xl text-lg text-muted-foreground">
            AI now shapes the videos children watch, the games they play, and the answers they get.
            Most tools let kids <em>use</em> AI. Few help them understand how it works — or think
            carefully about when it might be wrong.
          </p>
        </Section>
      </div>

      {/* How TechQuest Works */}
      <Section id="how-it-works" eyebrow="How it works" title={`How ${APP_NAME} works`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: UserPlus, title: "Create a learner profile", body: "Just a nickname and age range — no real names, no child logins." },
            { icon: Compass, title: "Play short missions", body: "5–10 minute missions with questions, activities, and instant feedback." },
            { icon: Brain, title: "Build real understanding", body: "Kids learn how AI finds patterns and makes predictions — and that it can be wrong." },
            { icon: Users, title: "Follow along as a parent", body: "See progress, what your child learned, and questions to ask at home." },
          ].map((s, i) => (
            <Card key={s.title}>
              <CardContent className="space-y-3 p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <s.icon className="size-5" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground">Step {i + 1}</p>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Example Mission */}
      <div className="bg-muted/40">
        <Section eyebrow="Example mission" title="See a mission in action">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-sm font-semibold text-primary">Mission 1 · How Does AI Learn?</p>
                <p className="text-sm text-muted-foreground">Concept: Examples → Patterns → Prediction</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="font-medium">You want an AI to know what a cat looks like. What helps it learn best?</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="rounded-md border border-border p-2">One blurry photo</li>
                  <li className="flex items-center gap-2 rounded-md border border-success/40 bg-success/10 p-2 font-medium text-success">
                    <CheckCircle2 className="size-4" /> Hundreds of cat photos
                  </li>
                  <li className="rounded-md border border-border p-2">A drawing of a dog</li>
                </ul>
                <p className="mt-3 flex items-start gap-2 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                  More good examples give the AI more chances to find the pattern.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Every mission ends with a reflection and a badge — and reminds kids that AI can make
                mistakes.
              </p>
            </CardContent>
          </Card>
        </Section>
      </div>

      {/* What Children Learn */}
      <Section eyebrow="What children learn" title="Real ideas, one mission at a time">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "How AI learns from examples",
            "How apps recommend videos and shows",
            "That AI can be wrong — and how to check",
            "How computers follow step-by-step instructions",
            "How robots use data and rules",
            "How to design a simple AI idea of their own",
          ].map((c) => (
            <div key={c} className="flex items-start gap-2 rounded-lg border border-border p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-sm font-medium">{c}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* What Parents See */}
      <div className="bg-muted/40">
        <Section eyebrow="For parents" title="What you'll see">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Sparkles, title: "Progress at a glance", body: "Missions completed, level, and streak for each learner." },
              { icon: Brain, title: "What your child learned", body: "Plain-language takeaways from every completed mission." },
              { icon: MessageCircleQuestion, title: "Try this at home", body: "Simple conversation prompts to keep the learning going." },
              { icon: Trophy, title: "Badges & milestones", body: "Encouraging rewards that celebrate real progress." },
            ].map((p) => (
              <Card key={p.title}>
                <CardContent className="flex items-start gap-3 p-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <p.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      {/* Safety and Privacy */}
      <Section eyebrow="Safety & privacy" title="Safe and private by design">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Children are profiles, not accounts — there are no child logins.",
            "We collect only a nickname and an age range. No real names, no photos.",
            "The AI is a bounded learning helper, never an open chatbot.",
            "Parents create the account and stay in control.",
          ].map((s) => (
            <div key={s} className="flex items-start gap-2 rounded-lg border border-border p-4">
              <Shield className="mt-0.5 size-5 shrink-0 text-success" />
              <span className="text-sm">{s}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div
          className="rounded-2xl px-8 py-12 text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-brand)" }}
        >
          <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Ready to help your child become AI-ready?
          </h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">
            Start free — learning through play and building, with you in control.
          </p>
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
