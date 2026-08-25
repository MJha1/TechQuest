import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  function renderPage() {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
  }

  it("renders the TechQuest heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /techquest/i })).toBeInTheDocument();
  });

  it("links to signup and login", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });
});
