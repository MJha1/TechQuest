import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ParentCredentialsSchema } from "@techquest/shared";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * Parent login. On success the parent lands on Child Home, where they pick or
 * add a learner.
 */
export default function LoginPage() {
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
    const { error: authError } = await signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setSubmitting(false);

    if (authError) {
      setError(authError.message ?? "Invalid email or password");
      return;
    }
    navigate("/parent");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5" noValidate>
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Log in to your parent account.</p>
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="underline">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
