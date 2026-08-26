import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ParentDashboard } from "@techquest/shared";
import ParentDashboardPage from "./ParentDashboardPage";

const { navigateMock, enterChildMock, getDashboardMock, activeChildRef } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  enterChildMock: vi.fn(),
  getDashboardMock: vi.fn(),
  activeChildRef: { current: null as unknown },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/context/ChildContext", () => ({
  useChildContext: () => ({
    status: "ready",
    children: [],
    activeChild: activeChildRef.current,
    setActiveChild: vi.fn(),
    enterChild: enterChildMock,
    clearActiveChild: vi.fn(),
    refresh: vi.fn(),
  }),
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
      streak: 1,
      missionsCompleted: 1,
      totalMissions: 2,
      learningMinutes: 9,
      conceptsLearned: ["Examples → Patterns → Prediction"],
      recentActivity: [{ label: "Completed “How AI Learns”", at: new Date().toISOString() }],
      whatLearned: [
        { mission: "How AI Learns", summary: "AI can find patterns in examples and use those patterns to make predictions." },
      ],
      tryAtHome: [{ mission: "How AI Learns", prompt: "Can AI make mistakes? Why?" }],
      recommended: { title: "How YouTube Knows", concept: "Recommendations", estimatedMinutes: 7, prompt: "Why similar videos?" },
    },
  ],
};

function renderPage() {
  render(
    <MemoryRouter>
      <ParentDashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  enterChildMock.mockReset();
  getDashboardMock.mockReset();
  getDashboardMock.mockResolvedValue(DASHBOARD);
  activeChildRef.current = null;
});

describe("ParentDashboardPage", () => {
  it("shows the educational sections for the child", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Nova" })).toBeInTheDocument();
    expect(screen.getByText("Learning Progress")).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 missions completed/i)).toBeInTheDocument();
    expect(screen.getByText(/what nova learned/i)).toBeInTheDocument();
    expect(
      screen.getByText(/AI can find patterns in examples/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Try This At Home")).toBeInTheDocument();
    expect(screen.getByText(/can ai make mistakes\? why\?/i)).toBeInTheDocument();
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText(/recommended next activity/i)).toBeInTheDocument();
    // Learning time is shown (estimated).
    expect(screen.getByText(/~9 min/i)).toBeInTheDocument();
  });

  it("enters a child's learning space", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /enter learning space/i }));
    expect(enterChildMock).toHaveBeenCalledWith("child_A");
    expect(navigateMock).toHaveBeenCalledWith("/child");
  });

  it("shows a friendly error with retry", async () => {
    getDashboardMock.mockReset();
    getDashboardMock.mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce(DASHBOARD);
    renderPage();

    expect(await screen.findByText(/couldn't load your dashboard/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("heading", { name: "Nova" })).toBeInTheDocument();
  });

  it("shows a 'Back to <child>' link only when a child is active, and it opens the child space", async () => {
    // No active child → no back link.
    renderPage();
    await screen.findByRole("heading", { name: "Nova" });
    expect(screen.queryByRole("button", { name: /back to/i })).not.toBeInTheDocument();

    // With an active child → the link appears and navigates to /child.
    activeChildRef.current = { nickname: "Pip" };
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /back to pip/i }));
    expect(navigateMock).toHaveBeenCalledWith("/child");
  });
});
