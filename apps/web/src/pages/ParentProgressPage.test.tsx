import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ParentDashboard } from "@techquest/shared";
import ParentProgressPage from "./ParentProgressPage";

const { getDashboardMock } = vi.hoisted(() => ({
  getDashboardMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getParentDashboard: getDashboardMock,
  ApiRequestError: class ApiRequestError extends Error {},
}));

const DASHBOARD: ParentDashboard = {
  children: [
    {
      id: "child_A",
      nickname: "Nova",
      ageBand: "AGE_8_9",
      avatar: "🦊",
      level: 2,
      xp: 180,
      streak: 3,
      missionsCompleted: 1,
      totalMissions: 2,
      learningMinutes: 9,
      conceptsLearned: ["Examples → Patterns → Prediction"],
      recentActivity: [{ label: "Completed “How AI Learns”", at: new Date().toISOString() }],
      whatLearned: [],
      tryAtHome: [],
      recommended: null,
    },
  ],
};

const EMPTY: ParentDashboard = {
  children: [
    {
      ...DASHBOARD.children[0],
      xp: 0,
      streak: 0,
      missionsCompleted: 0,
      learningMinutes: 0,
      conceptsLearned: [],
      recentActivity: [],
    },
  ],
};

function renderPage() {
  render(
    <MemoryRouter>
      <ParentProgressPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getDashboardMock.mockReset();
  getDashboardMock.mockResolvedValue(DASHBOARD);
});

describe("ParentProgressPage", () => {
  it("shows XP, streak, missions, and recent activity for a child with progress", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Nova" })).toBeInTheDocument();
    // XP and streak stats
    expect(screen.getByText("XP")).toBeInTheDocument();
    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText("Day streak")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    // Missions progress
    expect(screen.getByText(/1 of 2 missions completed/i)).toBeInTheDocument();
    // Recent activity
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText(/completed .how ai learns/i)).toBeInTheDocument();
  });

  it("shows the 'no activity yet' state when a learner hasn't started", async () => {
    getDashboardMock.mockReset();
    getDashboardMock.mockResolvedValue(EMPTY);
    renderPage();

    expect(await screen.findByText(/no activity yet/i)).toBeInTheDocument();
  });

  it("shows a friendly error with retry", async () => {
    getDashboardMock.mockReset();
    getDashboardMock.mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce(DASHBOARD);
    renderPage();

    expect(await screen.findByText(/couldn't load progress/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("heading", { name: "Nova" })).toBeInTheDocument();
  });
});
