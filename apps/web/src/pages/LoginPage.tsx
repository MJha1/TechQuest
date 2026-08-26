import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ShieldCheck, Compass } from "lucide-react";
import { APP_NAME, ParentCredentialsSchema } from "@techquest/shared";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";

/**
 * Parent login. Shares the branded onboarding shell (without the stepper) so the
 * returning-parent entry point feels like the same product as signup. On success
 * the parent lands on their dashboard.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Read straight from the form's DOM (not React state) so values filled by
    // the browser / a password manager are captured even when the autofill
    // doesn't fire React's onChange — otherwise the first submit sees empty
    // fields and silently does nothing.
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const parsed = ParentCredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }

    setSubmitting(true);
    try {
      const { error: authError } = await signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (authError) {
        setError(authError.message ?? "Invalid email or password");
        return;
      }
      navigate("/parent");
    } catch {
      // Network/transient failure (e.g. during a deploy): surface it instead of
      // leaving the button silently stuck.
      setError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingLayout
      title="Welcome back"
      subtitle="Log in to your parent account to see your child's progress."
      aside={<LoginAside />}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="underline">Create an account</Link>
        </p>
      </form>
    </OnboardingLayout>
  );
}

/** Reassurance shown alongside login — mirrors the signup aside for cohesion. */
function LoginAside() {
  const points = [
    { icon: Compass, title: "Pick up where they left off", body: "Your child's missions, XP, and streak are saved and waiting." },
    { icon: Sparkles, title: "See what they've learned", body: "Plain-language progress and questions to ask at home." },
    { icon: ShieldCheck, title: "You're in control", body: "Children are profiles, not accounts — no child logins, minimal data." },
  ];
  return (
    <div className="max-w-sm space-y-6">
      <p className="text-2xl font-bold leading-snug" style={{ fontFamily: "var(--font-display)" }}>
        Welcome back to {APP_NAME}.
      </p>
      <ul className="space-y-4">
        {points.map((p) => (
          <li key={p.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <p.icon className="size-4" />
            </span>
            <div>
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm opacity-90">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
