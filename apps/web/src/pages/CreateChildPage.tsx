import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CreateChildSchema, type AgeBand } from "@techquest/shared";
import { createChild, ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";

/**
 * Create a learner profile. A child is a profile, not an account: we collect
 * only a nickname, an age band (not a birth date), and an optional avatar — no
 * real name, school, or other personal information.
 */
const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: "AGE_8_9", label: "8–9 years" },
  { value: "AGE_10_12", label: "10–12 years" },
];

const AVATARS = ["🦊", "🤖", "🚀", "🐙", "🦉", "🐝", "🌟", "🦕"];

export default function CreateChildPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("AGE_8_9");
  const [avatar, setAvatar] = useState<string>(AVATARS[0]!);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = CreateChildSchema.safeParse({ nickname, ageBand, avatar });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the details");
      return;
    }

    setSubmitting(true);
    try {
      await createChild(parsed.data);
      navigate("/parent");
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Could not create the profile",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5" noValidate>
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Add a learner</h1>
          <p className="text-sm text-muted-foreground">
            Just a nickname and an age range — nothing personal.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="nickname" className="text-sm font-medium">Nickname</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ageBand" className="text-sm font-medium">Age range</label>
          <select
            id="ageBand"
            value={ageBand}
            onChange={(e) => setAgeBand(e.target.value as AgeBand)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {AGE_BANDS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Avatar</legend>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`avatar ${emoji}`}
                aria-pressed={avatar === emoji}
                onClick={() => setAvatar(emoji)}
                className={`h-10 w-10 rounded-md border text-xl ${
                  avatar === emoji ? "border-primary ring-2 ring-ring" : "border-border"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating…" : "Create profile"}
        </Button>
      </form>
    </main>
  );
}
