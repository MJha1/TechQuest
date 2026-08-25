import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Child } from "@techquest/shared";
import ChildHomePage from "./ChildHomePage";

function child(overrides: Partial<Child> = {}): Child {
  return {
    id: "child_1",
    parentId: "parent_1",
    nickname: "Nova",
    ageBand: "AGE_8_9",
    avatar: "🦊",
    level: 3,
    xp: 120,
    streak: 5,
    longestStreak: 5,
    lastActiveAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// The active child is supplied by ChildContext (RequireChild guarantees it).
const { activeChild } = vi.hoisted(() => ({ activeChild: { current: null as Child | null } }));
vi.mock("@/context/ChildContext", () => ({
  useChildContext: () => ({
    status: "ready",
    children: activeChild.current ? [activeChild.current] : [],
    activeChild: activeChild.current,
    setActiveChild: vi.fn(),
    clearActiveChild: vi.fn(),
    refresh: vi.fn(),
  }),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <ChildHomePage />
    </MemoryRouter>,
  );
}

describe("ChildHomePage", () => {
  it("greets the active child and shows their progress", () => {
    activeChild.current = child({ nickname: "Nova", level: 3, xp: 120 });
    renderPage();

    expect(screen.getByRole("heading", { name: /hi, nova!/i })).toBeInTheDocument();
    // XP appears (top bar + right panel + inline tiles).
    expect(screen.getAllByText(/120 XP/).length).toBeGreaterThan(0);
  });

  it("links into the missions flow", () => {
    activeChild.current = child();
    renderPage();
    expect(
      screen.getByRole("link", { name: /explore missions/i }),
    ).toHaveAttribute("href", "/missions");
  });
});
