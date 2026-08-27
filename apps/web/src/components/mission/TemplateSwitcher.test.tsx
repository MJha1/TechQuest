import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateSwitcher } from "./TemplateSwitcher";

describe("TemplateSwitcher", () => {
  it("lists the templates and marks the active one", () => {
    render(<TemplateSwitcher value="cards" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /quiz/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /open the box/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /spin the wheel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bubble pop/i })).toBeInTheDocument();
  });

  it("reports the picked template id", () => {
    const onChange = vi.fn();
    render(<TemplateSwitcher value="cards" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /spin the wheel/i }));
    expect(onChange).toHaveBeenCalledWith("wheel");
  });
});
