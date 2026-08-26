import { Lock, Play, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";

/** Visual states for a mission tile. Kept independent of mission business logic. */
export type MissionCardStatus = "locked" | "available" | "in_progress" | "completed";

export interface MissionCardProps {
  title: string;
  /** Short concept/topic line, e.g. "How computers think". */
  concept?: string;
  status: MissionCardStatus;
  /** 0..100, used when status is "in_progress". */
  progress?: number;
  xpReward?: number;
  estimatedMinutes?: number;
  /** Emoji or icon shown in the tile's badge. */
  icon?: React.ReactNode;
  /** Character emoji for the tile (takes precedence over `icon`). */
  emoji?: string;
  /** CSS gradient for the character tile background (defaults to the brand gradient). */
  gradient?: string;
  /** Highlights this card as the recommended next mission ("Start here" + pulse). */
  isNext?: boolean;
  onAction?: () => void;
  className?: string;
  /** Position in a list — drives a staggered entrance animation when provided. */
  index?: number;
}

const STATUS_META: Record<
  MissionCardStatus,
  { label: string; badge: React.ReactNode; cta: string; ctaVariant: "default" | "outline" | "secondary"; ctaIcon: React.ElementType }
> = {
  locked: {
    label: "Locked",
    badge: <Badge variant="outline">Locked</Badge>,
    cta: "Locked",
    ctaVariant: "secondary",
    ctaIcon: Lock,
  },
  available: {
    label: "Ready",
    badge: <Badge variant="accent">New</Badge>,
    cta: "Start mission",
    ctaVariant: "default",
    ctaIcon: Play,
  },
  in_progress: {
    label: "In progress",
    badge: <Badge variant="info">In progress</Badge>,
    cta: "Continue",
    ctaVariant: "default",
    ctaIcon: Play,
  },
  completed: {
    label: "Completed",
    badge: <Badge variant="success">Completed</Badge>,
    cta: "Review",
    ctaVariant: "outline",
    ctaIcon: Check,
  },
};

/**
 * A single mission tile. Playful and clear: bold title, a colorful topic badge,
 * XP reward, and a state-appropriate call to action. Purely presentational —
 * the parent supplies status/progress and handles `onAction`.
 */
export function MissionCard({
  title,
  concept,
  status,
  progress = 0,
  xpReward,
  estimatedMinutes,
  icon,
  emoji,
  gradient,
  isNext = false,
  onAction,
  className,
  index,
}: MissionCardProps) {
  const meta = STATUS_META[status];
  const CtaIcon = meta.ctaIcon;
  const locked = status === "locked";
  const character = emoji ?? icon ?? "🚀";
  const highlightNext = isNext && !locked;

  return (
    <Card
      interactive={!locked}
      className={cn(
        "group flex flex-col gap-4 p-5",
        locked && "opacity-70",
        highlightNext && "ring-2 ring-primary/40",
        index !== undefined && "animate-rise-in",
        className,
      )}
      style={index !== undefined ? { animationDelay: `${index * 60}ms` } : undefined}
      aria-label={`${title} — ${meta.label}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="relative">
          {/* Pulsing ring: draws the eye to the recommended next mission. */}
          {highlightNext && (
            <span
              className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary animate-pulse-ring"
              aria-hidden
            />
          )}
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-transform duration-200 ease-out",
              locked
                ? "bg-muted text-muted-foreground"
                : "text-primary-foreground group-hover:scale-110 group-hover:-rotate-3",
            )}
            style={locked ? undefined : { backgroundImage: gradient ?? "var(--gradient-brand)" }}
            aria-hidden
          >
            {locked ? (
              <Lock className="size-5" />
            ) : (
              <span
                className="inline-block animate-float group-hover:animate-wiggle"
                style={{ animationDelay: `${(index ?? 0) * 120}ms` }}
              >
                {character}
              </span>
            )}
          </div>
          {/* Sparkles: pop on hover for a bit of life. */}
          {!locked && (
            <>
              <span
                className="pointer-events-none absolute -right-1 -top-1 text-sm opacity-0 group-hover:animate-sparkle"
                aria-hidden
              >
                ✨
              </span>
              <span
                className="pointer-events-none absolute -left-1 top-2 text-xs opacity-0 group-hover:animate-sparkle [animation-delay:120ms]"
                aria-hidden
              >
                ✨
              </span>
            </>
          )}
          {/* Completed: a little celebration on arrival. */}
          {status === "completed" && (
            <span
              className="pointer-events-none absolute -right-1.5 -top-1.5 text-base animate-pop"
              aria-hidden
            >
              🎉
            </span>
          )}
        </div>
        {highlightNext && status === "available" ? (
          <Badge variant="accent" className="animate-pop">
            ✦ Start here
          </Badge>
        ) : (
          meta.badge
        )}
      </div>

      <div className="flex-1 space-y-1">
        <h3 className="text-lg font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h3>
        {concept && <p className="text-sm text-muted-foreground">{concept}</p>}
      </div>

      {status === "in_progress" && (
        <ProgressBar value={progress} tone="brand" label="Progress" showValue />
      )}

      <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
        {xpReward !== undefined && (
          <Badge variant="xp">+{xpReward} XP</Badge>
        )}
        {estimatedMinutes !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden /> {estimatedMinutes} min
          </span>
        )}
      </div>

      <Button
        variant={meta.ctaVariant}
        onClick={onAction}
        disabled={locked}
        className="w-full"
      >
        <CtaIcon className="size-4" aria-hidden />
        {meta.cta}
      </Button>
    </Card>
  );
}
