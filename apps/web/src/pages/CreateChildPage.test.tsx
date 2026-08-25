import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateChildPage from "./CreateChildPage";

const { navigateMock, createChildMock, setActiveChildMock, refreshMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  createChildMock: vi.fn(),
  setActiveChildMock: vi.fn(),
  refreshMock: vi.fn().mockResolvedValue(undefined),
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

vi.mock("@/context/ChildContext", () => ({
  useChildContext: () => ({ setActiveChild: setActiveChildMock, refresh: refreshMock }),
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
  setActiveChildMock.mockReset();
  refreshMock.mockClear();
});

describe("CreateChildPage", () => {
  it("creates a child with age band + interests and enters the child's home", async () => {
    const created = { id: "child_1", nickname: "Nova", ageBand: "AGE_10_11", interests: ["GAMES"] };
    createChildMock.mockResolvedValue(created);
    renderPage();

    fireEvent.change(screen.getByLabelText(/nickname/i), { target: { value: "Nova" } });
    fireEvent.click(screen.getByRole("radio", { name: "10–11" }));
    fireEvent.click(screen.getByRole("button", { name: /games/i }));
    fireEvent.click(screen.getByRole("button", { name: /start learning/i }));

    await waitFor(() =>
      expect(createChildMock).toHaveBeenCalledWith(
        expect.objectContaining({ nickname: "Nova", ageBand: "AGE_10_11", interests: ["GAMES"] }),
      ),
    );
    // Sets the new child active, then routes into their space to start mission 1.
    await waitFor(() => expect(setActiveChildMock).toHaveBeenCalledWith(created));
    expect(navigateMock).toHaveBeenCalledWith("/child");
  });

  it("rejects a too-short nickname without calling the API", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/nickname/i), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /start learning/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(createChildMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
