import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./progress-bar";

describe("ProgressBar", () => {
  it("exposes an accessible progress value", () => {
    render(<ProgressBar value={40} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("renders a label and value readout", () => {
    render(<ProgressBar value={720} max={1000} label="XP" showValue />);
    expect(screen.getByText("XP")).toBeInTheDocument();
    expect(screen.getByText("720 / 1000")).toBeInTheDocument();
  });

  it("clamps values above the maximum", () => {
    render(<ProgressBar value={150} max={100} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
