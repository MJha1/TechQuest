import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@/lib/auth-client";
import { ChildProvider } from "@/context/ChildContext";
import { LoadingState } from "@/components/ui/loading-state";

/**
 * Layout-route guard for every authenticated (parent) route. Redirects to login
 * when there is no session, and otherwise mounts the ChildProvider once so all
 * nested routes share one child list / active-child selection. Auth is checked
 * here alone — no page repeats it.
 *
 * This is a UX gate; the API independently enforces auth + child ownership on
 * every request, so it is never the only line of defense.
 */
export default function RequireParent() {
  const { data, isPending } = useSession();

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <LoadingState label="Checking your session…" />
      </main>
    );
  }
  if (!data) return <Navigate to="/login" replace />;

  return (
    <ChildProvider>
      <Outlet />
    </ChildProvider>
  );
}
