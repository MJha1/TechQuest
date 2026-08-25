import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireParent from "@/components/RequireParent";
import RequireChild from "@/components/RequireChild";
import LandingPage from "@/pages/LandingPage";
import { LoadingState } from "@/components/ui/loading-state";

/**
 * Application route tree.
 *
 * Code-splitting: the public landing page is eager (it's the marketing entry —
 * we want an instant first paint), while every other page is `lazy()`-loaded so
 * a first-time visitor doesn't download the whole authenticated app (mission
 * player, parent dashboard, etc.) just to see the landing page. Each lazy page
 * becomes its own chunk fetched on navigation.
 *
 * Access control lives entirely in two pathless layout guards — no page checks
 * auth itself:
 *   • RequireParent — every authenticated route; redirects to /login when there
 *     is no parent session, and provides the shared ChildProvider.
 *   • RequireChild  — nested inside RequireParent for the child learning routes;
 *     requires an active, parent-owned child context.
 *
 * Public:   /  /login  /signup  /design
 * Parent:   /create-child  /parent  /parent/progress  /parent/feedback
 * Child:    /child  /missions  /missions/:missionId  /missions/:missionId/complete
 */
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const StyleGuidePage = lazy(() => import("@/pages/StyleGuidePage"));
const CreateChildPage = lazy(() => import("@/pages/CreateChildPage"));
const ParentDashboardPage = lazy(() => import("@/pages/ParentDashboardPage"));
const ParentProgressPage = lazy(() => import("@/pages/ParentProgressPage"));
const ParentFeedbackPage = lazy(() => import("@/pages/ParentFeedbackPage"));
const ChildHomePage = lazy(() => import("@/pages/ChildHomePage"));
const MissionsPage = lazy(() => import("@/pages/MissionsPage"));
const MissionDetailPage = lazy(() => import("@/pages/MissionDetailPage"));
const MissionCompletePage = lazy(() => import("@/pages/MissionCompletePage"));

/** Wrap a lazily-loaded page in a Suspense boundary with a full-screen loader. */
function lazyRoute(node: ReactNode): ReactNode {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-8">
          <LoadingState label="Loading…" />
        </main>
      }
    >
      {node}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // Public
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: lazyRoute(<LoginPage />) },
  { path: "/signup", element: lazyRoute(<SignupPage />) },
  { path: "/design", element: lazyRoute(<StyleGuidePage />) },

  // Authenticated (parent session required)
  {
    element: <RequireParent />,
    children: [
      { path: "/create-child", element: lazyRoute(<CreateChildPage />) },
      { path: "/parent", element: lazyRoute(<ParentDashboardPage />) },
      { path: "/parent/progress", element: lazyRoute(<ParentProgressPage />) },
      { path: "/parent/feedback", element: lazyRoute(<ParentFeedbackPage />) },

      // Child learning (active, owned child context required)
      {
        element: <RequireChild />,
        children: [
          { path: "/child", element: lazyRoute(<ChildHomePage />) },
          { path: "/missions", element: lazyRoute(<MissionsPage />) },
          { path: "/missions/:missionId", element: lazyRoute(<MissionDetailPage />) },
          { path: "/missions/:missionId/complete", element: lazyRoute(<MissionCompletePage />) },
        ],
      },
    ],
  },

  // Unknown routes → landing
  { path: "*", element: <Navigate to="/" replace /> },
]);
