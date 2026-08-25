import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SignupPage from "./SignupPage";

// Spy on navigation and the auth client (hoisted so the mock factories can use them).
const { navigateMock, signUpEmail } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  signUpEmail: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/lib/auth-client", () => ({
  signUp: { email: signUpEmail },
  signIn: { email: vi.fn() },
  signOut: vi.fn(),
  useSession: () => ({ data: null, isPending: false }),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  );
}

function fillForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
}

beforeEach(() => {
  navigateMock.mockReset();
  signUpEmail.mockReset();
});

describe("SignupPage", () => {
  it("signs up and continues to create-child on success", async () => {
    signUpEmail.mockResolvedValue({ data: { user: {} }, error: null });
    renderPage();

    fillForm("parent@example.com", "supersecret");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() =>
      expect(signUpEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: "parent@example.com", password: "supersecret" }),
      ),
    );
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/create-child"));
  });

  it("shows a validation error and does not call the API for a bad email", async () => {
    renderPage();

    fillForm("not-an-email", "supersecret");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(signUpEmail).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("surfaces an auth error from the server", async () => {
    signUpEmail.mockResolvedValue({ data: null, error: { message: "Email already exists" } });
    renderPage();

    fillForm("parent@example.com", "supersecret");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
