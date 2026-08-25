import { Home, Compass, Trophy, Settings, PartyPopper, Inbox } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import type { NavItem } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { XPDisplay } from "@/components/XPDisplay";
import { StreakDisplay } from "@/components/StreakDisplay";
import { MissionCard } from "@/components/MissionCard";

const NAV_ITEMS: NavItem[] = [
  { to: "/design", label: "Dashboard", icon: Home, end: true },
  { to: "/design/missions", label: "Missions", icon: Compass },
  { to: "/design/rewards", label: "Rewards", icon: Trophy },
  { to: "/design/settings", label: "Settings", icon: Settings },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function ToastButtons() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast({ title: "Saved!", variant: "success" })}>
        Success toast
      </Button>
      <Button
        variant="outline"
        onClick={() => toast({ title: "Couldn't save", description: "Please try again.", variant: "error" })}
      >
        Error toast
      </Button>
    </div>
  );
}

/**
 * Living style guide — renders every design-system component inside the AppShell
 * so the shell, tokens, and components can be reviewed together. No business
 * logic; all data is illustrative.
 */
export default function StyleGuidePage() {
  return (
    <AppShell
      experience="child"
      items={NAV_ITEMS}
      title="Design System"
      topBarRight={
        <>
          <StreakDisplay streak={5} />
          <XPDisplay xp={1280} level={4} />
          <Avatar size="sm">
            <AvatarFallback>🦊</AvatarFallback>
          </Avatar>
        </>
      }
      sidebarFooter={
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>🦊</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Nova</p>
            <p className="text-xs text-muted-foreground">Level 4</p>
          </div>
        </div>
      }
      rightPanel={
        <div className="space-y-4">
          <XPDisplay xp={1280} level={4} size="large" />
          <StreakDisplay streak={5} size="large" />
        </div>
      }
    >
      <div className="mx-auto max-w-5xl space-y-10">
        <Section title="Buttons">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success">Success</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Completed</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">In progress</Badge>
            <Badge variant="accent">New</Badge>
            <Badge variant="xp">+50 XP</Badge>
            <Badge variant="streak">🔥 5</Badge>
          </div>
        </Section>

        <Section title="Rewards">
          <div className="grid gap-4 sm:grid-cols-2">
            <XPDisplay xp={1280} level={4} size="large" />
            <StreakDisplay streak={5} size="large" />
          </div>
        </Section>

        <Section title="Progress">
          <div className="max-w-md space-y-4">
            <ProgressBar value={40} label="Mission progress" showValue />
            <ProgressBar value={720} max={1000} tone="xp" label="XP to next level" showValue />
          </div>
        </Section>

        <Section title="Cards & Avatars">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>A calm card</CardTitle>
                <CardDescription>Used across parent and child surfaces.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback>NK</AvatarFallback>
                </Avatar>
                <Avatar size="lg">
                  <AvatarFallback>🚀</AvatarFallback>
                </Avatar>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Dialog</CardTitle>
                <CardDescription>Focus-trapped, ESC to close.</CardDescription>
              </CardHeader>
              <CardContent>
                <Modal>
                  <ModalTrigger asChild>
                    <Button variant="outline">Open modal</Button>
                  </ModalTrigger>
                  <ModalContent>
                    <ModalHeader>
                      <ModalTitle>Ready for a new mission?</ModalTitle>
                      <ModalDescription>
                        You'll earn XP and keep your streak going.
                      </ModalDescription>
                    </ModalHeader>
                    <ModalFooter>
                      <ModalClose asChild>
                        <Button variant="ghost">Not now</Button>
                      </ModalClose>
                      <ModalClose asChild>
                        <Button>Let's go</Button>
                      </ModalClose>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Mission cards">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MissionCard title="Meet the Machines" concept="How computers think" status="available" xpReward={50} estimatedMinutes={10} icon="🤖" />
            <MissionCard title="Pattern Power" concept="Spotting patterns" status="in_progress" progress={60} xpReward={75} estimatedMinutes={15} icon="🧩" />
            <MissionCard title="Robot Rules" concept="Giving instructions" status="completed" xpReward={60} estimatedMinutes={12} icon="🦾" />
            <MissionCard title="AI Detective" concept="How AI learns" status="locked" xpReward={100} estimatedMinutes={20} icon="🔍" />
          </div>
        </Section>

        <Section title="Toasts">
          <ToastButtons />
        </Section>

        <Section title="States">
          <div className="grid gap-4 lg:grid-cols-3">
            <LoadingState label="Loading missions…" />
            <ErrorState onRetry={() => {}} />
            <EmptyState
              icon={<Inbox className="size-7" />}
              title="No missions yet"
              description="New adventures are on the way."
              action={
                <Button>
                  <PartyPopper className="size-4" /> Explore
                </Button>
              }
            />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
