import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./LandingPage";

const { trackMock, sessionState } = vi.hoisted(() => ({
  trackMock: vi.fn(),
  sessionState: {
    current: { data: null as unknown, isPending: false },
  },
}));
vi.mock("@/lib/analytics", () => ({ track: trackMock }));
vi.mock("@/lib/auth-client", () => ({ useSession: () => sessionState.current }));

// jsdom doesn't implement scrollIntoView (used by "See how it works").
beforeEach(() => {
  trackMock.mockReset();
  sessionState.current = { data: null, isPending: false }; // logged-out by default
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
      screen.getByRole("heading", { name: /become AI-ready through play/i }),
    ).toBeInTheDocument();
  });

  it("renders all the required sections", () => {
    renderPage();
    for (const heading of [
      /techquest in 4 steps/i, // How it works
      /tap a real mission/i, // Interactive sample
      /real ideas, one mission at a time/i, // What Children Learn
      /what you'll see/i, // What Parents See
      /safe by design/i, // Safety & Privacy
      /ready to start/i, // CTA
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });

  it("lets you answer the sample mission and shows instant feedback", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /hundreds of cat photos/i }));
    expect(screen.getByText(/correct!/i)).toBeInTheDocument();
  });

  it("personalizes the page and login button for a signed-in parent", () => {
    sessionState.current = { data: { user: { id: "p1", name: "nova.parent" } }, isPending: false };
    renderPage();
    // Greets by first name (derived from the account's display name).
    expect(screen.getByText(/welcome back, nova/i)).toBeInTheDocument();
    // The login button becomes a personalized "Continue as …" → dashboard.
    expect(screen.getByRole("link", { name: /continue as nova/i })).toHaveAttribute("href", "/parent");
    expect(screen.getByRole("link", { name: /go to your dashboard/i })).toHaveAttribute("href", "/parent");
  });

  it("has the primary and secondary CTAs", () => {
    renderPage();
    const tryLinks = screen.getAllByRole("link", { name: /try techquest/i });
    expect(tryLinks.length).toBeGreaterThan(0);
    expect(tryLinks[0]).toHaveAttribute("href", "/signup");
    expect(screen.getAllByRole("button", { name: /see how it works/i }).length).toBeGreaterThan(0);
    const parentLogin = screen.getAllByRole("link", { name: /parent log in/i });
    expect(parentLogin.length).toBeGreaterThan(0);
    expect(parentLogin[0]).toHaveAttribute("href", "/login");
  });

  it("tracks cta_clicked for the primary and secondary CTAs", () => {
    renderPage();
    fireEvent.click(screen.getAllByRole("link", { name: /try techquest/i })[0]!);
    expect(trackMock).toHaveBeenCalledWith("cta_clicked", expect.objectContaining({ cta: expect.any(String) }));

    fireEvent.click(screen.getAllByRole("button", { name: /see how it works/i })[0]!);
    expect(trackMock).toHaveBeenCalledWith("cta_clicked", { cta: "see_how_it_works" });
  });
});
