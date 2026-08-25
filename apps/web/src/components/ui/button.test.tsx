import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import { Button } from "./button";

describe("Button", () => {
  it("renders a button with its label", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    render(<Button variant="accent">Accent</Button>);
    expect(screen.getByRole("button", { name: /accent/i }).className).toContain("bg-accent");
  });

  it("renders as a link when asChild is used", () => {
    render(
      <MemoryRouter>
        <Button asChild>
          <Link to="/next">Go</Link>
        </Button>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: /go/i });
    expect(link).toHaveAttribute("href", "/next");
    // Inherits button styling via Slot.
    expect(link.className).toContain("inline-flex");
  });
});
