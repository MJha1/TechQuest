import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Child, BadgeStatus, ChildMissionSummary, Mission } from "@techquest/shared";
import ChildHomePage from "./ChildHomePage";

const { navigateMock, listMissionsMock, listBadgesMock, activeChild } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  listMissionsMock: vi.fn(),
  listBadgesMock: vi.fn(),
  activeChild: { current: null as Child | null },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

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

vi.mock("@/lib/api", () => ({
  listChildMissions: listMissionsMock,
  listChildBadges: listBadgesMock,
  ApiRequestError: class ApiRequestError extends Error {},
}));

function child(overrides: Partial<Child> = {}): Child {
  return {
    id: "child_1", parentId: "parent_1", nickname: "Nova", ageBand: "AGE_8_9", avatar: "🦊",
    level: 3, xp: 120, streak: 5, longestStreak: 5, lastActiveAt: null,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function mission(id: string, title: string, order: number): Mission {
  return {
    id, slug: id, title, subtitle: null, concept: `${title} concept`, description: null,
    order, estimatedMinutes: 8, isPublished: true,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function summary(m: Mission, over: Partial<ChildMissionSummary> = {}): ChildMissionSummary {
  return { mission: m, totalSteps: 5, completedSteps: 0, progress: null, ...over };
}

const BADGES: BadgeStatus[] = [
  { badge: { slug: "first-explorer", name: "First Explorer", description: "d", icon: "🧭" }, earned: true, earnedAt: "2026-01-02T00:00:00.000Z" },
  { badge: { slug: "ai-explorer", name: "AI Explorer", description: "d", icon: "🚀" }, earned: false, earnedAt: null },
];

function renderPage() {
  render(
    <MemoryRouter>
      <ChildHomePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  listMissionsMock.mockReset();
  listBadgesMock.mockReset();
  activeChild.current = child();
  listMissionsMock.mockResolvedValue([
    summary(mission("m1", "How AI Learns", 1)),
    summary(mission("m2", "How YouTube Knows", 2)),
  ]);
  listBadgesMock.mockResolvedValue(BADGES);
});

describe("ChildHomePage dashboard", () => {
  it("greets the child and shows level, XP and streak", async () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /hi, nova!/i })).toBeInTheDocument();
    expect(screen.getAllByText(/120 XP/).length).toBeGreaterThan(0);
    // Level shown in the sidebar footer + XP display.
    expect(screen.getAllByText(/level 3/i).length).toBeGreaterThan(0);
    // Streak value.
    expect(screen.getAllByText(/5 days/i).length).toBeGreaterThan(0);
    await screen.findByText("How AI Learns");
  });

  it("features today's mission with a Start Mission CTA that opens it", async () => {
    renderPage();
    expect(await screen.findByText(/today's mission/i)).toBeInTheDocument();
    expect(await screen.findByText("How AI Learns")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start mission/i }));
    expect(navigateMock).toHaveBeenCalledWith("/missions/m1");
  });

  it("shows overall progress and a recommended next mission", async () => {
    renderPage();
    expect(await screen.findByText(/0 of 2 missions complete/i)).toBeInTheDocument();
    expect(screen.getByText(/recommended next/i)).toBeInTheDocument();
    expect(screen.getByText("How YouTube Knows")).toBeInTheDocument();
  });

  it("shows earned badges", async () => {
    renderPage();
    expect(await screen.findAllByText("First Explorer")).not.toHaveLength(0);
  });

  it("shows a friendly error with retry (no technical detail)", async () => {
    listMissionsMock.mockRejectedValueOnce(new Error("Request failed with status 500"));
    listBadgesMock.mockResolvedValue(BADGES);
    renderPage();

    expect(await screen.findByText(/couldn't load your dashboard/i)).toBeInTheDocument();
    // The raw error text must never reach the child.
    expect(screen.queryByText(/status 500/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
