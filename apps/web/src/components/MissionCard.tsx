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
  onAction?: () => void;
  className?: string;
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
  onAction,
  className,
}: MissionCardProps) {
  const meta = STATUS_META[status];
  const CtaIcon = meta.ctaIcon;
  const locked = status === "locked";

  return (
    <Card
      className={cn(
        "flex flex-col gap-4 p-5 transition-shadow",
        locked ? "opacity-70" : "hover:shadow-md",
        className,
      )}
      aria-label={`${title} — ${meta.label}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl",
            locked ? "bg-muted text-muted-foreground" : "text-primary-foreground",
          )}
          style={locked ? undefined : { backgroundImage: "var(--gradient-brand)" }}
          aria-hidden
        >
          {locked ? <Lock className="size-5" /> : (icon ?? "🚀")}
        </div>
        {meta.badge}
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
