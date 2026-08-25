import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";

describe("status states", () => {
  it("LoadingState announces via a status role", () => {
    render(<LoadingState label="Loading missions…" />);
    expect(screen.getByRole("status")).toHaveTextContent(/loading missions/i);
  });

  it("ErrorState shows an alert and triggers retry", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("EmptyState renders its title, description, and action", () => {
    render(
      <EmptyState
        title="No missions yet"
        description="Coming soon"
        action={<button>Explore</button>}
      />,
    );
    expect(screen.getByText(/no missions yet/i)).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /explore/i })).toBeInTheDocument();
  });
});
