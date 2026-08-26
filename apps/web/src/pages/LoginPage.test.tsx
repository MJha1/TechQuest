import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";

// Spy on navigation and the auth client (hoisted so the mock factories can use them).
const { navigateMock, signInEmail } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  signInEmail: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/lib/auth-client", () => ({
  signIn: { email: signInEmail },
  signUp: { email: vi.fn() },
  signOut: vi.fn(),
  useSession: () => ({ data: null, isPending: false }),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

function fillForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
}

beforeEach(() => {
  navigateMock.mockReset();
  signInEmail.mockReset();
});

describe("LoginPage", () => {
  it("logs in and continues to the parent dashboard on success", async () => {
    signInEmail.mockResolvedValue({ data: { user: {} }, error: null });
    renderPage();

    fillForm("parent@example.com", "supersecret");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(signInEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: "parent@example.com", password: "supersecret" }),
      ),
    );
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/parent"));
  });

  it("shows a validation error and does not call the API for a bad email", async () => {
    renderPage();

    fillForm("not-an-email", "supersecret");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(signInEmail).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("surfaces an auth error from the server as a friendly message", async () => {
    signInEmail.mockResolvedValue({ data: null, error: { message: "Invalid email or password" } });
    renderPage();

    fillForm("parent@example.com", "wrong-password");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("recovers from a network failure instead of silently hanging", async () => {
    // Better Auth throws (rather than returning {error}) on network/transient
    // failures — e.g. during a deploy. The form must surface it, not get stuck.
    signInEmail.mockRejectedValue(new Error("Failed to fetch"));
    renderPage();

    fillForm("parent@example.com", "supersecret");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    // Button is usable again (not stuck on "Logging in…").
    await waitFor(() => expect(screen.getByRole("button", { name: /log in/i })).not.toBeDisabled());
  });
});
