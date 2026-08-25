import { createBrowserRouter, Navigate } from "react-router-dom";
import RequireParent from "@/components/RequireParent";
import RequireChild from "@/components/RequireChild";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import StyleGuidePage from "@/pages/StyleGuidePage";
import CreateChildPage from "@/pages/CreateChildPage";
import ParentDashboardPage from "@/pages/ParentDashboardPage";
import ParentProgressPage from "@/pages/ParentProgressPage";
import ParentFeedbackPage from "@/pages/ParentFeedbackPage";
import ChildHomePage from "@/pages/ChildHomePage";
import MissionsPage from "@/pages/MissionsPage";
import MissionDetailPage from "@/pages/MissionDetailPage";
import MissionCompletePage from "@/pages/MissionCompletePage";

/**
 * Application route tree.
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
export const router = createBrowserRouter([
  // Public
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/design", element: <StyleGuidePage /> },

  // Authenticated (parent session required)
  {
    element: <RequireParent />,
    children: [
      { path: "/create-child", element: <CreateChildPage /> },
      { path: "/parent", element: <ParentDashboardPage /> },
      { path: "/parent/progress", element: <ParentProgressPage /> },
      { path: "/parent/feedback", element: <ParentFeedbackPage /> },

      // Child learning (active, owned child context required)
      {
        element: <RequireChild />,
        children: [
          { path: "/child", element: <ChildHomePage /> },
          { path: "/missions", element: <MissionsPage /> },
          { path: "/missions/:missionId", element: <MissionDetailPage /> },
          { path: "/missions/:missionId/complete", element: <MissionCompletePage /> },
        ],
      },
    ],
  },

  // Unknown routes → landing
  { path: "*", element: <Navigate to="/" replace /> },
]);
