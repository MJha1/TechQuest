import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ShieldCheck, Compass } from "lucide-react";
import { APP_NAME, ParentCredentialsSchema } from "@techquest/shared";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { track } from "@/lib/analytics";

/**
 * Parent signup — step 1 of onboarding. Collects only what an account needs
 * (email + password); no child data and no extra personal details. On success
 * the parent continues to Create Child.
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => track("signup_started"), []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = ParentCredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }

    setSubmitting(true);
    // Derive a display name from the email local-part so we don't collect a
    // separate real name.
    const name = parsed.data.email.split("@")[0] || "Parent";
    try {
      const { data, error: authError } = await signUp.email({
        email: parsed.data.email,
        password: parsed.data.password,
        name,
      });
      if (authError) {
        setError(authError.message ?? "Could not create your account");
        return;
      }
      // Pseudonymous account id only — never the email.
      track("signup_completed", { userRef: data?.user?.id ?? "unknown" });
      navigate("/create-child");
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
      step={0}
      title="Create your account"
      subtitle="You're the account holder. Next, you'll set up a learner profile for your child."
      aside={<SignupAside />}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Continue"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="underline">Log in</Link>
        </p>
      </form>
    </OnboardingLayout>
  );
}

/** What/who/why reassurance shown alongside signup. */
function SignupAside() {
  const points = [
    {
      icon: Compass,
      title: `What ${APP_NAME} is`,
      body: "Short, playful missions that teach kids how AI and technology actually work.",
    },
    {
      icon: Sparkles,
      title: "Who it's for",
      body: "Curious children aged 8–12 — guided by you, no child logins required.",
    },
    {
      icon: ShieldCheck,
      title: "Why it matters",
      body: "Kids grow up surrounded by AI. TechQuest helps them understand and question it, not just use it.",
    },
  ];
  return (
    <div className="max-w-sm space-y-6">
      <p className="text-2xl font-bold leading-snug" style={{ fontFamily: "var(--font-display)" }}>
        Help your child become AI-ready by learning through play and building.
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
