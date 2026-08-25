import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, MessageCircleQuestion, Trophy } from "lucide-react";
import {
  APP_NAME,
  CreateChildSchema,
  type AgeBand,
  type Interest,
} from "@techquest/shared";
import { createChild, ApiRequestError } from "@/lib/api";
import { useChildContext } from "@/context/ChildContext";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { cn } from "@/lib/utils";

/**
 * Create a learner profile — step 2 of onboarding, and the last thing before the
 * child's own space. A child is a profile, not an account: we collect only a
 * nickname, a coarse age band (never a birth date), a few optional interests
 * (used to tailor content, not to identify), and a preset avatar — no real name,
 * school, or other personal information.
 *
 * On success we set this child active and drop the parent straight into the
 * child's home, where "Start Mission" begins the first mission — so onboarding
 * flows Landing → Signup → Create Child → Child Home → First Mission with no
 * detours.
 */
const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: "AGE_8_9", label: "8–9" },
  { value: "AGE_10_11", label: "10–11" },
  { value: "AGE_12", label: "12" },
];

const INTERESTS: { value: Interest; label: string; emoji: string }[] = [
  { value: "GAMES", label: "Games", emoji: "🎮" },
  { value: "SCIENCE", label: "Science", emoji: "🔬" },
  { value: "STORIES", label: "Stories", emoji: "📖" },
  { value: "SPORTS", label: "Sports", emoji: "⚽" },
  { value: "ART", label: "Art", emoji: "🎨" },
  { value: "BUILDING", label: "Building", emoji: "🧱" },
];

const AVATARS = ["🦊", "🤖", "🚀", "🐙", "🦉", "🐝", "🌟", "🦕"];

export default function CreateChildPage() {
  const navigate = useNavigate();
  const { setActiveChild, refresh } = useChildContext();
  const [nickname, setNickname] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("AGE_8_9");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [avatar, setAvatar] = useState<string>(AVATARS[0]!);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleInterest(value: Interest) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = CreateChildSchema.safeParse({ nickname, ageBand, interests, avatar });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the details");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createChild(parsed.data);
      // Pseudonymous child id, coarse age band, and only the *count* of interests
      // — never the nickname or the specific categories.
      track("child_created", {
        childRef: created.id,
        ageBand: created.ageBand,
        interestCount: created.interests.length,
      });
      // Make this child active and enter their space to start the first mission.
      await refresh();
      setActiveChild(created);
      navigate("/child");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not create the profile");
      setSubmitting(false);
    }
  }

  return (
    <OnboardingLayout
      step={1}
      title="Add your child"
      subtitle="Just a nickname and an age range — nothing personal. Interests are optional."
      aside={<CreateChildAside />}
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <label htmlFor="nickname" className="text-sm font-medium">Nickname</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="What should we call them?"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">A fun nickname — not their real name.</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Age range</legend>
          <div role="radiogroup" aria-label="Age range" className="grid grid-cols-3 gap-2">
            {AGE_BANDS.map((b) => (
              <button
                key={b.value}
                type="button"
                role="radio"
                aria-checked={ageBand === b.value}
                onClick={() => setAgeBand(b.value)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  ageBand === b.value
                    ? "border-primary bg-secondary text-secondary-foreground ring-2 ring-ring"
                    : "border-border hover:bg-muted",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Interests <span className="font-normal text-muted-foreground">(optional)</span>
          </legend>
          <p className="text-xs text-muted-foreground">
            Pick a few — we'll use them to suggest missions.
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((it) => {
              const selected = interests.includes(it.value);
              return (
                <button
                  key={it.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleInterest(it.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    selected
                      ? "border-primary bg-secondary text-secondary-foreground ring-2 ring-ring"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <span aria-hidden>{it.emoji}</span>
                  {it.label}
                </button>
              );
            })}
          </div>
        </fieldset>

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
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md border text-xl",
                  avatar === emoji ? "border-primary ring-2 ring-ring" : "border-border",
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Setting up…" : "Start learning"}
        </Button>
      </form>
    </OnboardingLayout>
  );
}

/** "What your child will do" reassurance shown alongside the form. */
function CreateChildAside() {
  const points = [
    {
      icon: Compass,
      title: "Play short missions",
      body: "5–10 minute missions with questions, activities, and instant feedback.",
    },
    {
      icon: MessageCircleQuestion,
      title: "Learn by doing",
      body: "Kids explore how AI learns, recommends, and can get things wrong — hands-on.",
    },
    {
      icon: Trophy,
      title: "Earn along the way",
      body: "XP, streaks, and badges celebrate real progress and keep them coming back.",
    },
  ];
  return (
    <div className="max-w-sm space-y-6">
      <p className="text-2xl font-bold leading-snug" style={{ fontFamily: "var(--font-display)" }}>
        Here's what {APP_NAME} looks like for your child.
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
