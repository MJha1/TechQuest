/**
 * Per-mission visual identity for the missions catalog: a character emoji and a
 * themed gradient. Keyed by mission slug so the catalog stays data-driven. Any
 * unknown slug falls back to a stable pick from a small palette (derived from
 * the slug, so the same mission always looks the same across renders).
 *
 * Gradients are built from the design-system color tokens, so they follow the
 * active light/dark theme automatically.
 */
export interface MissionTheme {
  /** Character emoji shown in the mission tile. */
  emoji: string;
  /** CSS gradient (theme-aware) for the character tile background. */
  gradient: string;
}

const g = (from: string, to: string): string =>
  `linear-gradient(135deg, var(--color-${from}), var(--color-${to}))`;

/** Known launch missions → character + color. */
const THEMES: Record<string, MissionTheme> = {
  "how-ai-learns": { emoji: "🧠", gradient: g("primary", "accent") },
  "how-youtube-knows": { emoji: "📺", gradient: g("info", "primary") },
  "can-ai-be-wrong": { emoji: "🤔", gradient: g("warning", "xp") },
  "how-computers-follow-instructions": { emoji: "🧩", gradient: g("accent", "info") },
  "teach-the-robot": { emoji: "🤖", gradient: g("success", "info") },
  "build-your-first-ai-idea": { emoji: "🎯", gradient: g("xp", "streak") },
};

const FALLBACK_EMOJIS = ["🚀", "✨", "🌟", "🧪", "🔮", "💡"];
const FALLBACK_GRADIENTS = [
  g("primary", "accent"),
  g("info", "primary"),
  g("xp", "streak"),
  g("success", "info"),
  g("warning", "xp"),
  g("accent", "info"),
];

/** Small stable hash so an unknown slug maps to a consistent fallback. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** The visual theme for a mission, by slug. Never throws; always returns one. */
export function missionTheme(slug: string): MissionTheme {
  const known = THEMES[slug];
  if (known) return known;
  const i = hash(slug);
  return {
    emoji: FALLBACK_EMOJIS[i % FALLBACK_EMOJIS.length],
    gradient: FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length],
  };
}
