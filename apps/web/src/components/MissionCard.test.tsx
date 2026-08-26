import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MissionCard } from "./MissionCard";

describe("MissionCard", () => {
  it("renders title, concept, and XP reward", () => {
    render(<MissionCard title="Meet the Machines" concept="How computers think" status="available" xpReward={50} />);
    expect(screen.getByRole("heading", { name: /meet the machines/i })).toBeInTheDocument();
    expect(screen.getByText(/how computers think/i)).toBeInTheDocument();
    expect(screen.getByText(/\+50 XP/)).toBeInTheDocument();
  });

  it("fires onAction when available", () => {
    const onAction = vi.fn();
    render(<MissionCard title="Go" status="available" onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: /start mission/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("disables the action when locked", () => {
    render(<MissionCard title="Secret" status="locked" />);
    expect(screen.getByRole("button", { name: /locked/i })).toBeDisabled();
  });

  it("shows a progress bar when in progress", () => {
    render(<MissionCard title="Halfway" status="in_progress" progress={60} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("marks completed missions", () => {
    render(<MissionCard title="Done" status="completed" />);
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /review/i })).toBeInTheDocument();
  });

  it("shows a 'Start here' hint on the recommended next mission", () => {
    render(<MissionCard title="Begin" status="available" isNext />);
    expect(screen.getByText(/start here/i)).toBeInTheDocument();
  });

  it("renders the mission's character emoji", () => {
    render(<MissionCard title="Brains" status="available" emoji="🧠" />);
    expect(screen.getByText("🧠")).toBeInTheDocument();
  });
});
