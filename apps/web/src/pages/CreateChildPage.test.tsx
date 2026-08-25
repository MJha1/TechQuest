import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateChildPage from "./CreateChildPage";

const { navigateMock, createChildMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  createChildMock: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/lib/api", () => ({
  createChild: createChildMock,
  listChildren: vi.fn(),
  getChild: vi.fn(),
  updateChild: vi.fn(),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderPage() {
  render(
    <MemoryRouter>
      <CreateChildPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigateMock.mockReset();
  createChildMock.mockReset();
});

describe("CreateChildPage", () => {
  it("creates a child and continues to the parent dashboard", async () => {
    createChildMock.mockResolvedValue({ id: "child_1", nickname: "Nova" });
    renderPage();

    fireEvent.change(screen.getByLabelText(/nickname/i), { target: { value: "Nova" } });
    fireEvent.change(screen.getByLabelText(/age range/i), { target: { value: "AGE_10_12" } });
    fireEvent.click(screen.getByRole("button", { name: /create profile/i }));

    await waitFor(() =>
      expect(createChildMock).toHaveBeenCalledWith(
        expect.objectContaining({ nickname: "Nova", ageBand: "AGE_10_12" }),
      ),
    );
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/parent"));
  });

  it("rejects a too-short nickname without calling the API", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/nickname/i), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /create profile/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(createChildMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
