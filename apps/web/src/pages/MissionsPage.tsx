import { useNavigate } from "react-router-dom";
import { useChildContext } from "@/context/ChildContext";
import { childNav } from "@/lib/nav";
import { AppShell } from "@/components/layout/AppShell";
import { MissionCard, type MissionCardStatus } from "@/components/MissionCard";
import { XPDisplay } from "@/components/XPDisplay";
import { StreakDisplay } from "@/components/StreakDisplay";

/**
 * Mission list for the active child. Illustrative placeholder tiles only — there
 * is no mission data model or progression logic yet; tiles simply route into the
 * mission detail flow to exercise the nested routes.
 */
const PLACEHOLDER_MISSIONS: {
  id: string;
  title: string;
  concept: string;
  status: MissionCardStatus;
  xpReward: number;
  minutes: number;
  icon: string;
  progress?: number;
}[] = [
  { id: "meet-the-machines", title: "Meet the Machines", concept: "How computers think", status: "available", xpReward: 50, minutes: 10, icon: "🤖" },
  { id: "pattern-power", title: "Pattern Power", concept: "Spotting patterns", status: "in_progress", xpReward: 75, minutes: 15, icon: "🧩", progress: 60 },
  { id: "robot-rules", title: "Robot Rules", concept: "Giving instructions", status: "completed", xpReward: 60, minutes: 12, icon: "🦾" },
  { id: "ai-detective", title: "AI Detective", concept: "How AI learns", status: "locked", xpReward: 100, minutes: 20, icon: "🔍" },
];

export default function MissionsPage() {
  const { activeChild } = useChildContext();
  const child = activeChild!;
  const navigate = useNavigate();

  return (
    <AppShell
      experience="child"
      items={childNav}
      title="Missions"
      topBarRight={
        <>
          <StreakDisplay streak={child.streak} />
          <XPDisplay xp={child.xp} level={child.level} />
        </>
      }
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_MISSIONS.map((m) => (
            <MissionCard
              key={m.id}
              title={m.title}
              concept={m.concept}
              status={m.status}
              progress={m.progress}
              xpReward={m.xpReward}
              estimatedMinutes={m.minutes}
              icon={m.icon}
              onAction={() => navigate(`/missions/${m.id}`)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
