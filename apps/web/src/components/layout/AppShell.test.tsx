import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Home, Compass } from "lucide-react";
import { AppShell } from "./AppShell";
import type { NavItem } from "@/components/Navigation";

const ITEMS: NavItem[] = [
  { to: "/design", label: "Dashboard", icon: Home, end: true },
  { to: "/design/missions", label: "Missions", icon: Compass },
];

function renderShell() {
  render(
    <MemoryRouter>
      <AppShell
        items={ITEMS}
        title="Dashboard"
        topBarRight={<span>right-slot</span>}
        rightPanel={<div>context-panel</div>}
      >
        <p>main-content</p>
      </AppShell>
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  it("renders navigation, title, content, and the contextual panel", () => {
    renderShell();
    // Nav items render (desktop sidebar). Use getAllByRole because the drawer
    // also mounts a copy.
    expect(screen.getAllByRole("link", { name: /missions/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText("main-content")).toBeInTheDocument();
    expect(screen.getByText("context-panel")).toBeInTheDocument();
    expect(screen.getByText("right-slot")).toBeInTheDocument();
  });

  it("exposes a mobile menu toggle", () => {
    renderShell();
    expect(screen.getByRole("button", { name: /open navigation/i })).toBeInTheDocument();
  });
});
