import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ParentFeedbackPage from "./ParentFeedbackPage";

const { submitMock, trackMock } = vi.hoisted(() => ({ submitMock: vi.fn(), trackMock: vi.fn() }));

vi.mock("@/lib/api", () => ({
  submitFeedback: submitMock,
  ApiRequestError: class ApiRequestError extends Error {},
}));
vi.mock("@/lib/analytics", () => ({ track: trackMock }));

function renderPage() {
  render(
    <MemoryRouter>
      <ParentFeedbackPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  submitMock.mockReset();
  trackMock.mockReset();
  submitMock.mockResolvedValue({ id: "f_1", rating: "loved_it", comment: null, createdAt: "2026-01-01T00:00:00.000Z" });
});

describe("ParentFeedbackPage", () => {
  it("shows the four ratings and disables submit until one is picked", () => {
    renderPage();
    for (const label of ["Loved it", "Good", "Okay", "Not useful"]) {
      expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /send feedback/i })).toBeDisabled();
  });

  it("submits the rating + comment, tracks it, and thanks the parent", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /loved it/i }));
    fireEvent.change(screen.getByLabelText(/what should we improve/i), {
      target: { value: "More animal missions" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() =>
      expect(submitMock).toHaveBeenCalledWith({ rating: "loved_it", comment: "More animal missions" }),
    );
    expect(trackMock).toHaveBeenCalledWith("feedback_submitted", { rating: "loved_it", hasComment: true });
    expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
  });

  it("works with a rating and no comment", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^okay/i }));
    fireEvent.click(screen.getByRole("button", { name: /send feedback/i }));

    await waitFor(() => expect(submitMock).toHaveBeenCalledWith({ rating: "okay", comment: undefined }));
    expect(trackMock).toHaveBeenCalledWith("feedback_submitted", { rating: "okay", hasComment: false });
  });
});
