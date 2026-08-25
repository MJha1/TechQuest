import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { XPDisplay } from "./XPDisplay";
import { StreakDisplay } from "./StreakDisplay";

describe("XPDisplay", () => {
  it("formats the XP value and level", () => {
    render(<XPDisplay xp={1280} level={4} />);
    expect(screen.getByText("1,280 XP")).toBeInTheDocument();
    expect(screen.getByText(/Lv 4/)).toBeInTheDocument();
  });
});

describe("StreakDisplay", () => {
  it("shows the streak count", () => {
    render(<StreakDisplay streak={5} size="large" />);
    expect(screen.getByText(/5 days/i)).toBeInTheDocument();
    expect(screen.getByText(/streak going strong/i)).toBeInTheDocument();
  });

  it("reads as calm when the streak is zero", () => {
    render(<StreakDisplay streak={0} size="large" />);
    expect(screen.getByText(/start a streak today/i)).toBeInTheDocument();
  });
});
