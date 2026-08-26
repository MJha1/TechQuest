import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { resetAnalytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Signs the parent out: clears the Better Auth session, resets the analytics
 * identity, and returns to the login screen. The stored active-child selection
 * self-heals on the next session (the child context re-validates it), so there's
 * nothing else to clear here.
 */
export function SignOutButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
    } catch {
      // Even if the network call fails, drop the local identity and leave.
    }
    resetAnalytics();
    navigate("/login");
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={busy}
      className={cn("justify-start text-muted-foreground hover:text-foreground", className)}
    >
      <LogOut className="size-4" aria-hidden />
      {busy ? "Signing out…" : "Sign out"}
    </Button>
  );
}
