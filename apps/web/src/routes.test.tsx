import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { Child } from "@techquest/shared";
import RequireParent from "@/components/RequireParent";
import RequireChild from "@/components/RequireChild";

// Control the parent session and the child list that the guards depend on.
const { session } = vi.hoisted(() => ({ session: { current: null as null | { user: object } } }));
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: session.current, isPending: false }),
}));

const { listChildrenMock } = vi.hoisted(() => ({ listChildrenMock: vi.fn() }));
vi.mock("@/lib/api", () => ({
  listChildren: listChildrenMock,
  createChild: vi.fn(),
  getChild: vi.fn(),
  updateChild: vi.fn(),
  ApiRequestError: class ApiRequestError extends Error {},
}));

const CHILD: Child = {
  id: "child_A",
  parentId: "parent_A",
  nickname: "Nova",
  ageBand: "AGE_8_9",
  interests: [],
  avatar: "🦊",
  level: 1,
  xp: 0,
  streak: 0,
  longestStreak: 0,
  lastActiveAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

/**
 * Exercises the real guards against the same nesting the app uses
 * (RequireParent → RequireChild) with dummy leaf routes. Uses MemoryRouter +
 * Routes so a guard's <Navigate> redirect resolves synchronously in the test.
 */
function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route path="/create-child" element={<div>create-child-page</div>} />
        <Route element={<RequireParent />}>
          <Route path="/parent" element={<div>parent-area</div>} />
          <Route element={<RequireChild />}>
            <Route path="/missions" element={<div>missions-area</div>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  session.current = null;
  listChildrenMock.mockReset();
  localStorage.clear();
});

describe("route guards", () => {
  it("redirects an unauthenticated visitor to /login", async () => {
    session.current = null;
    renderAt("/parent");
    expect(await screen.findByText("login-page")).toBeInTheDocument();
  });

  it("lets an authenticated parent into parent routes", async () => {
    session.current = { user: {} };
    listChildrenMock.mockResolvedValue([]);
    renderAt("/parent");
    expect(await screen.findByText("parent-area")).toBeInTheDocument();
  });

  it("blocks a child route when no child is active, sending the parent to pick one", async () => {
    session.current = { user: {} };
    listChildrenMock.mockResolvedValue([CHILD]); // has children, none active
    renderAt("/missions");
    expect(await screen.findByText("parent-area")).toBeInTheDocument();
  });

  it("sends a parent with no children to create one", async () => {
    session.current = { user: {} };
    listChildrenMock.mockResolvedValue([]);
    renderAt("/missions");
    expect(await screen.findByText("create-child-page")).toBeInTheDocument();
  });

  it("loads a child route when an owned child is the active context", async () => {
    session.current = { user: {} };
    listChildrenMock.mockResolvedValue([CHILD]);
    localStorage.setItem("techquest.activeChildId", CHILD.id);
    renderAt("/missions");
    expect(await screen.findByText("missions-area")).toBeInTheDocument();
  });
});
