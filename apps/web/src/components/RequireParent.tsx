import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@/lib/auth-client";
import { ChildProvider } from "@/context/ChildContext";
import { LoadingState } from "@/components/ui/loading-state";
import { identifyParent } from "@/lib/analytics";

/**
 * Layout-route guard for every authenticated (parent) route. Redirects to login
 * when there is no session, and otherwise mounts the ChildProvider once so all
 * nested routes share one child list / active-child selection. Auth is checked
 * here alone — no page repeats it.
 *
 * This is a UX gate; the API independently enforces auth + child ownership on
 * every request, so it is never the only line of defense.
 */
function SessionLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <LoadingState label="Checking your session…" />
    </main>
  );
}

export default function RequireParent() {
  const { data, isPending, isRefetching, refetch } = useSession();

  // Identify the parent by their pseudonymous account id (never email/name).
  const userId = data?.user?.id;
  useEffect(() => {
    if (userId) identifyParent(userId);
  }, [userId]);

  // A freshly logged-in parent can momentarily read an empty session store (the
  // store lags a tick behind sign-in), and the session check can hit a transient
  // blip. Rather than bounce to /login on that first empty read — which clears
  // the login form and makes login "fail on the first try" — revalidate exactly
  // once and wait for a definitive answer before deciding.
  const triedRef = useRef(false);
  const [revalidating, setRevalidating] = useState(false);
  useEffect(() => {
    if (!isPending && !data && !triedRef.current) {
      triedRef.current = true;
      setRevalidating(true);
      void refetch().finally(() => setRevalidating(false));
    }
  }, [isPending, data, refetch]);

  if (isPending || isRefetching || revalidating) return <SessionLoading />;
  // First paint, before the revalidation effect has run: don't flash a redirect.
  if (!data && !triedRef.current) return <SessionLoading />;
  if (!data) return <Navigate to="/login" replace />;

  return (
    <ChildProvider>
      <Outlet />
    </ChildProvider>
  );
}
