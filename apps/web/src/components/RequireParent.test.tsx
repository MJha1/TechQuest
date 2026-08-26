import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RequireParent from "./RequireParent";

// A mutable session store the mocked useSession reads from; refetch can flip it.
const store = vi.hoisted(() => ({ current: { data: null as unknown, isPending: false } }));
const refetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ ...store.current, isRefetching: false, error: null, refetch: refetchMock }),
}));
vi.mock("@/context/ChildContext", () => ({
  ChildProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/analytics", () => ({ identifyParent: vi.fn() }));

function renderGuard() {
  render(
    <MemoryRouter initialEntries={["/parent"]}>
      <Routes>
        <Route element={<RequireParent />}>
          <Route path="/parent" element={<div>PROTECTED</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  refetchMock.mockReset();
  store.current = { data: null, isPending: false };
});

describe("RequireParent", () => {
  it("does NOT bounce to login when the session is briefly empty then resolves", async () => {
    // Simulate the post-login lag: the store is empty until refetch populates it.
    refetchMock.mockImplementation(async () => {
      store.current = { data: { user: { id: "p1" } }, isPending: false };
    });
    renderGuard();

    // It revalidates instead of redirecting…
    await waitFor(() => expect(refetchMock).toHaveBeenCalledTimes(1));
    // …and then renders the protected content — never the login page.
    expect(await screen.findByText("PROTECTED")).toBeInTheDocument();
    expect(screen.queryByText("LOGIN PAGE")).not.toBeInTheDocument();
  });

  it("redirects to login when there is genuinely no session after revalidation", async () => {
    refetchMock.mockResolvedValue(undefined); // still no session
    renderGuard();

    expect(await screen.findByText("LOGIN PAGE")).toBeInTheDocument();
    expect(screen.queryByText("PROTECTED")).not.toBeInTheDocument();
  });

  it("renders protected content immediately when a session already exists", async () => {
    store.current = { data: { user: { id: "p1" } }, isPending: false };
    renderGuard();

    expect(await screen.findByText("PROTECTED")).toBeInTheDocument();
    expect(refetchMock).not.toHaveBeenCalled();
  });
});
