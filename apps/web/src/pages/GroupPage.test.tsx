import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Child, FamilyLeaderboard } from "@techquest/shared";
import GroupPage from "./GroupPage";
import { clearCache } from "@/lib/useCachedResource";

const { leaderboardMock, activeChild } = vi.hoisted(() => ({
  leaderboardMock: vi.fn(),
  activeChild: { current: null as Child | null },
}));

vi.mock("@/context/ChildContext", () => ({
  useChildContext: () => ({
    status: "ready",
    children: activeChild.current ? [activeChild.current] : [],
    activeChild: activeChild.current,
    setActiveChild: vi.fn(),
    enterChild: vi.fn(),
    clearActiveChild: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  getFamilyLeaderboard: leaderboardMock,
  ApiRequestError: class ApiRequestError extends Error {},
}));

function child(over: Partial<Child> = {}): Child {
  return {
    id: "child_1", parentId: "parent_1", nickname: "Nova", ageBand: "AGE_8_9", interests: [], avatar: "🦊",
    level: 2, xp: 120, streak: 3, longestStreak: 3, lastActiveAt: null,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", ...over,
  };
}

const BOARD: FamilyLeaderboard = {
  scope: "family",
  currentChildId: "child_1",
  totalMissions: 2,
  missions: [
    { id: "m1", slug: "how-ai-learns", title: "How AI Learns", order: 1 },
    { id: "m2", slug: "how-youtube-knows", title: "How YouTube Knows", order: 2 },
  ],
  entries: [
    { id: "child_2", nickname: "Pixel", avatar: "🤖", level: 4, xp: 300, streak: 1, missionsCompleted: 2, completedMissionIds: ["m1", "m2"], rank: 1, isCurrent: false },
    { id: "child_1", nickname: "Nova", avatar: "🦊", level: 2, xp: 120, streak: 3, missionsCompleted: 1, completedMissionIds: ["m1"], rank: 2, isCurrent: true },
  ],
};

function renderPage() {
  render(
    <MemoryRouter>
      <GroupPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  clearCache();
  leaderboardMock.mockReset();
  activeChild.current = child();
  leaderboardMock.mockResolvedValue(BOARD);
});

describe("GroupPage", () => {
  it("shows the ranked standings and flags the viewing child", async () => {
    renderPage();
    // Leader first, with names shown.
    expect(await screen.findByText("Pixel")).toBeInTheDocument();
    expect(screen.getByText("Nova")).toBeInTheDocument();
    // The viewer's own row is labelled "You".
    expect(screen.getByText("You")).toBeInTheDocument();
    // XP figures are rendered.
    expect(screen.getByText(/300 XP · Lv 4/)).toBeInTheDocument();
  });

  it("switches to the missions board", async () => {
    renderPage();
    await screen.findByText("Pixel");
    fireEvent.click(screen.getByRole("tab", { name: /missions/i }));
    // The board lists the missions (as column headers) and marks completions.
    expect(await screen.findAllByText("How AI Learns")).not.toHaveLength(0);
    // Pixel completed 2 missions + Nova completed 1 → 3 "Completed" cells.
    expect(screen.getAllByText("Completed")).toHaveLength(3);
  });

  it("shows a friendly solo note for an only child", async () => {
    leaderboardMock.mockResolvedValue({
      ...BOARD,
      entries: [BOARD.entries[1]],
    });
    renderPage();
    expect(await screen.findByText(/flying solo/i)).toBeInTheDocument();
  });
});
