import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ParentCredentialsSchema } from "@techquest/shared";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * Parent signup. Collects only what an account needs — email + password. No
 * child data and no extra personal details are gathered here.
 * On success the parent continues to Create Child.
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    const { error: authError } = await signUp.email({
      email: parsed.data.email,
      password: parsed.data.password,
      name,
    });
    setSubmitting(false);

    if (authError) {
      setError(authError.message ?? "Could not create your account");
      return;
    }
    navigate("/create-child");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5" noValidate>
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">Parents sign up to get started.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Sign up"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="underline">Log in</Link>
        </p>
      </form>
    </main>
  );
}
