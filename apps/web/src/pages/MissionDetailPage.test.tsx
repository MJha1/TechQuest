import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Child, ChildMissionState, AnswerResult } from "@techquest/shared";
import MissionDetailPage from "./MissionDetailPage";

const { navigateMock, startMock, answerMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  startMock: vi.fn(),
  answerMock: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock, useParams: () => ({ missionId: "m1" }) };
});

const CHILD: Child = {
  id: "child_A", parentId: "parent_A", nickname: "Nova", ageBand: "AGE_8_9", avatar: "🦊",
  level: 1, xp: 0, streak: 0, longestStreak: 0, lastActiveAt: null,
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};

vi.mock("@/context/ChildContext", () => ({
  useChildContext: () => ({
    status: "ready",
    children: [CHILD],
    activeChild: CHILD,
    setActiveChild: vi.fn(),
    clearActiveChild: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  startMission: startMock,
  answerStep: answerMock,
  completeMission: vi.fn(),
  listChildMissions: vi.fn(),
  ApiRequestError: class ApiRequestError extends Error {},
}));

const STATE: ChildMissionState = {
  mission: {
    id: "m1", slug: "m1", title: "How AI Learns", subtitle: "Examples & patterns", concept: "Examples → Patterns",
    description: null, order: 1, estimatedMinutes: 8, isPublished: true,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      { id: "st_choice", missionId: "m1", order: 1, type: "CHOICE", title: "Pick one", content: { prompt: "Which helps?", options: [{ id: "a", label: "One photo" }, { id: "b", label: "Many photos" }] }, xpReward: 10 },
      { id: "st_done", missionId: "m1", order: 2, type: "COMPLETION", title: "All done", content: { heading: "Yay", body: "You finished" }, xpReward: 30 },
    ],
  },
  status: "IN_PROGRESS", score: null, startedAt: null, completedAt: null, steps: [],
};

const choiceResult: AnswerResult = {
  correct: true, feedback: "More examples help.", xpAwarded: 10,
  step: { missionStepId: "st_choice", status: "COMPLETED", isCorrect: true, attempts: 1, response: null, completedAt: null },
  child: { xp: 10, level: 1 },
};
const completionResult: AnswerResult = {
  correct: null, feedback: null, xpAwarded: 30,
  step: { missionStepId: "st_done", status: "COMPLETED", isCorrect: null, attempts: 1, response: null, completedAt: null },
  child: { xp: 40, level: 1 },
};

function renderPage() {
  render(
    <MemoryRouter>
      <MissionDetailPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  startMock.mockReset();
  answerMock.mockReset();
});

describe("MissionDetailPage (mission player)", () => {
  it("shows a loading state while the mission starts", () => {
    startMock.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(screen.getByText(/loading mission/i)).toBeInTheDocument();
  });

  it("shows an error with retry, and recovers on retry", async () => {
    startMock.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(STATE);
    renderPage();

    expect(await screen.findByText(/couldn't start this mission/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByRole("heading", { name: "Pick one" })).toBeInTheDocument();
  });

  it("plays through: answer → immediate feedback → advance → finish", async () => {
    startMock.mockResolvedValue(STATE);
    answerMock.mockResolvedValueOnce(choiceResult).mockResolvedValueOnce(completionResult);
    renderPage();

    // First step (CHOICE) renders.
    expect(await screen.findByRole("heading", { name: "Pick one" })).toBeInTheDocument();

    // Answer it → immediate feedback.
    fireEvent.click(screen.getByLabelText(/many photos/i));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(await screen.findByText(/correct!/i)).toBeInTheDocument();
    expect(answerMock).toHaveBeenCalledWith("m1", "st_choice", "child_A", { optionId: "b" });

    // Continue → last step (COMPLETION).
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByRole("heading", { name: "All done" })).toBeInTheDocument();

    // Finish → records completion answer, then routes to the complete screen.
    fireEvent.click(screen.getByRole("button", { name: /finish mission/i }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/missions/m1/complete"));
  });
});
