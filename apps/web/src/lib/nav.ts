import { Home, Compass, Users, LayoutDashboard, TrendingUp, MessageSquare } from "lucide-react";
import type { NavItem } from "@/components/Navigation";

/** Sidebar items for the child learning experience. */
export const childNav: NavItem[] = [
  { to: "/child", label: "Home", icon: Home, end: true },
  { to: "/missions", label: "Missions", icon: Compass },
  { to: "/group", label: "Group", icon: Users },
];

/** Sidebar items for the parent area. */
export const parentNav: NavItem[] = [
  { to: "/parent", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/parent/progress", label: "Progress", icon: TrendingUp },
  { to: "/parent/feedback", label: "Feedback", icon: MessageSquare },
];
