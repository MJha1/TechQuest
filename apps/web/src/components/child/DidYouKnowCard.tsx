import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { RobotMascot } from "@/components/landing/illustrations";

/**
 * Short, true, kid-friendly tech/AI facts. Deliberately no invented numbers —
 * each is a real, checkable fact phrased for ages 8–12.
 */
const FACTS = [
  "Computers really only understand two numbers — 0 and 1. Everything you see is built from them!",
  "AI learns by looking at LOTS of examples — sometimes millions of pictures.",
  "The word “robot” comes from an old word that means “hard work.”",
  "The first computer “bug” was a real moth found inside a computer back in 1947.",
  "Ada Lovelace wrote the very first computer instructions almost 200 years ago.",
  "The game of Go has more possible boards than there are atoms in the universe — and AI still learned to win!",
  "AI “neural networks” are named after the billions of tiny cells inside your brain.",
  "Your favorite apps use AI to guess what you might like to watch or hear next.",
];

/**
 * A friendly "Did you know?" fun-fact card for the child home. Shows one true
 * tech/AI fact per visit alongside the reactive mascot — a small, self-contained
 * dose of curiosity that reinforces what the missions teach.
 */
export function DidYouKnowCard({ className }: { className?: string }) {
  // Rotate per visit: a fresh fact each time the home mounts.
  const fact = useMemo(() => FACTS[Math.floor(Math.random() * FACTS.length)], []);

  return (
    <Card className={cn("relative overflow-hidden border-xp/40 bg-xp/10", className)}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="group w-14 shrink-0">
          <RobotMascot className="w-full transition-transform duration-300 ease-out group-hover:-rotate-3 group-hover:scale-110" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-xp-foreground">
            💡 Did you know?
          </p>
          <p className="mt-1 text-sm font-medium">{fact}</p>
        </div>
      </CardContent>
    </Card>
  );
}
