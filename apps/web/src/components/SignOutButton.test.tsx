import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SignOutButton } from "./SignOutButton";

const { navigateMock, signOutMock, resetMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  signOutMock: vi.fn(),
  resetMock: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/lib/auth-client", () => ({ signOut: signOutMock }));
vi.mock("@/lib/analytics", () => ({ resetAnalytics: resetMock }));

beforeEach(() => {
  navigateMock.mockReset();
  signOutMock.mockReset().mockResolvedValue(undefined);
  resetMock.mockReset();
});

describe("SignOutButton", () => {
  it("signs out, resets analytics, and returns to login", async () => {
    render(
      <MemoryRouter>
        <SignOutButton />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });

  it("still returns to login even if sign-out fails", async () => {
    signOutMock.mockRejectedValueOnce(new Error("network"));
    render(
      <MemoryRouter>
        <SignOutButton />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/login"));
  });
});
