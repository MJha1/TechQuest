import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Confetti } from "./confetti";

describe("Confetti", () => {
  it("renders nothing until triggered", () => {
    const { container } = render(<Confetti trigger={0} pieces={5} />);
    expect(container.querySelectorAll("span").length).toBe(0);
  });

  it("renders the requested number of pieces when triggered", () => {
    const { container } = render(<Confetti trigger={1} pieces={6} />);
    expect(container.querySelectorAll("span").length).toBe(6);
  });
});
