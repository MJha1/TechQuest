/**
 * Self-contained SVG illustrations for the landing page. No external image
 * hosts — everything is inline vector art so it renders offline, stays crisp at
 * any size, and can animate via the theme's motion tokens (float/pop), which are
 * disabled under prefers-reduced-motion.
 */

/** Friendly robot mascot — the visual anchor of the hero. Purely decorative. */
export function RobotMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="A friendly robot"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tq-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(157 66% 56%)" />
          <stop offset="100%" stopColor="hsl(185 74% 46%)" />
        </linearGradient>
        <radialGradient id="tq-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="hsl(157 66% 52%)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(157 66% 52%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft glow behind the mascot */}
      <circle cx="200" cy="190" r="180" fill="url(#tq-glow)" />

      {/* Orbiting sparkles / shapes */}
      <g className="animate-float" style={{ animationDelay: "0.2s" }}>
        <path d="M70 110 l7 16 16 7 -16 7 -7 16 -7 -16 -16 -7 16 -7z" fill="hsl(205 88% 62%)" />
      </g>
      <g className="animate-float" style={{ animationDelay: "0.9s" }}>
        <path d="M330 150 l6 13 13 6 -13 6 -6 13 -6 -13 -13 -6 13 -6z" fill="hsl(258 82% 68%)" />
      </g>
      <g className="animate-float" style={{ animationDelay: "1.4s" }}>
        <circle cx="60" cy="270" r="9" fill="hsl(45 95% 60%)" />
      </g>
      <g className="animate-float" style={{ animationDelay: "0.5s" }}>
        <circle cx="345" cy="285" r="7" fill="hsl(157 66% 56%)" />
      </g>

      {/* Robot */}
      <g className="animate-float">
        {/* Antenna */}
        <line x1="200" y1="120" x2="200" y2="92" stroke="hsl(216 20% 40%)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="200" cy="84" r="11" fill="hsl(45 95% 60%)" />

        {/* Ears */}
        <rect x="96" y="182" width="26" height="60" rx="12" fill="hsl(216 20% 32%)" />
        <rect x="278" y="182" width="26" height="60" rx="12" fill="hsl(216 20% 32%)" />

        {/* Head */}
        <rect x="112" y="122" width="176" height="164" rx="46" fill="url(#tq-body)" />

        {/* Face plate */}
        <rect x="134" y="150" width="132" height="96" rx="30" fill="hsl(220 26% 9%)" />

        {/* Eyes */}
        <circle cx="176" cy="196" r="15" fill="#fff" />
        <circle cx="224" cy="196" r="15" fill="#fff" />
        <circle cx="178" cy="198" r="6" fill="hsl(220 26% 12%)" />
        <circle cx="226" cy="198" r="6" fill="hsl(220 26% 12%)" />

        {/* Smile */}
        <path d="M172 224 Q200 246 228 224" fill="none" stroke="hsl(157 66% 56%)" strokeWidth="7" strokeLinecap="round" />

        {/* Cheeks */}
        <circle cx="150" cy="222" r="7" fill="hsl(157 66% 56%)" opacity="0.5" />
        <circle cx="250" cy="222" r="7" fill="hsl(157 66% 56%)" opacity="0.5" />

        {/* Body hint */}
        <rect x="150" y="286" width="100" height="26" rx="13" fill="hsl(216 20% 26%)" />
      </g>
    </svg>
  );
}

/** A large emoji tile used across the visual sections. */
export function EmojiTile({
  emoji,
  label,
  caption,
  className,
}: {
  emoji: string;
  label: string;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-4xl" aria-hidden>
        {emoji}
      </span>
      <p className="mt-2 font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {label}
      </p>
      {caption && <p className="mt-0.5 text-sm text-muted-foreground">{caption}</p>}
    </div>
  );
}
