import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./LandingPage";

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ track: trackMock }));

// jsdom doesn't implement scrollIntoView (used by "See how it works").
beforeEach(() => {
  trackMock.mockReset();
  Element.prototype.scrollIntoView = vi.fn();
});

function renderPage() {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe("LandingPage", () => {
  it("leads with the core message and tracks landing_viewed", () => {
    renderPage();
    expect(trackMock).toHaveBeenCalledWith("landing_viewed");
    expect(
      screen.getByRole("heading", { name: /become AI-ready by learning through play and building/i }),
    ).toBeInTheDocument();
  });

  it("renders all the required sections", () => {
    renderPage();
    for (const heading of [
      /how techquest works/i,
      /use technology every day/i, // Problem
      /see a mission in action/i, // Example Mission
      /real ideas, one mission at a time/i, // What Children Learn
      /what you'll see/i, // What Parents See
      /safe and private by design/i, // Safety & Privacy
      /ready to help your child become AI-ready/i, // CTA
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });

  it("has the primary and secondary CTAs", () => {
    renderPage();
    const tryLinks = screen.getAllByRole("link", { name: /try techquest/i });
    expect(tryLinks.length).toBeGreaterThan(0);
    expect(tryLinks[0]).toHaveAttribute("href", "/signup");
    expect(screen.getAllByRole("button", { name: /see how it works/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /^log in$/i })).toHaveAttribute("href", "/login");
  });

  it("tracks cta_clicked for the primary and secondary CTAs", () => {
    renderPage();
    fireEvent.click(screen.getAllByRole("link", { name: /try techquest/i })[0]!);
    expect(trackMock).toHaveBeenCalledWith("cta_clicked", expect.objectContaining({ cta: expect.any(String) }));

    fireEvent.click(screen.getAllByRole("button", { name: /see how it works/i })[0]!);
    expect(trackMock).toHaveBeenCalledWith("cta_clicked", { cta: "see_how_it_works" });
  });
});
