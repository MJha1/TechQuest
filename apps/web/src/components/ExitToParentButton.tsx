import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Leaves the child's learning space and returns to the parent dashboard, where
 * the account controls (including sign-out) live. Shown in the child top bar so
 * a supervising parent can always get back without editing the URL. The label
 * collapses to just the icon on narrow screens.
 */
export function ExitToParentButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/parent")}
      aria-label="Exit to parent area"
      className="text-muted-foreground hover:text-foreground"
    >
      <ShieldCheck className="size-4" aria-hidden />
      <span className="hidden sm:inline">Exit to parent</span>
    </Button>
  );
}
