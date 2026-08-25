import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Child, BadgeStatus } from "@techquest/shared";
import ChildHomePage from "./ChildHomePage";

const { listBadgesMock } = vi.hoisted(() => ({ listBadgesMock: vi.fn() }));
vi.mock("@/lib/api", () => ({
  listChildBadges: listBadgesMock,
  ApiRequestError: class ApiRequestError extends Error {},
}));

const BADGES: BadgeStatus[] = [
  { badge: { slug: "first-explorer", name: "First Explorer", description: "d", icon: "🧭" }, earned: true, earnedAt: "2026-01-02T00:00:00.000Z" },
  { badge: { slug: "ai-explorer", name: "AI Explorer", description: "d", icon: "🚀" }, earned: false, earnedAt: null },
];

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

beforeEach(() => {
  listBadgesMock.mockReset();
  listBadgesMock.mockResolvedValue(BADGES);
});

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

  it("shows the child's badges (earned + locked)", async () => {
    activeChild.current = child();
    renderPage();

    expect(await screen.findByText("First Explorer")).toBeInTheDocument();
    expect(screen.getByText("AI Explorer")).toBeInTheDocument();
  });
});
