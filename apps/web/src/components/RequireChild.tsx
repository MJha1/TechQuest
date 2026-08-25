import { Navigate, Outlet } from "react-router-dom";
import { useChildContext } from "@/context/ChildContext";
import { LoadingState } from "@/components/ui/loading-state";

/**
 * Layout-route guard for child learning routes. Nested under RequireParent, so a
 * parent session is already guaranteed; this adds the child-context requirement:
 * a specific, parent-owned child must be active.
 *
 *  - still loading the child list → show a loader (don't redirect prematurely)
 *  - a child is active            → render the learning routes
 *  - no child active              → send the parent to pick one (/parent), or to
 *                                    create the first one (/create-child)
 *
 * Ownership is implicit: `activeChild` can only be one of the parent's own
 * children (the API scopes the list), so an active child is an authorized one.
 */
export default function RequireChild() {
  const { status, activeChild, children } = useChildContext();

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <LoadingState label="Loading learner…" />
      </main>
    );
  }

  if (!activeChild) {
    return <Navigate to={children.length > 0 ? "/parent" : "/create-child"} replace />;
  }

  return <Outlet />;
}
