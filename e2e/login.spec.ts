import { test, expect } from "@playwright/test";
import { signUpAndEnterChild } from "./helpers";

/**
 * Login flow. We first register a parent (via signup), then clear the session
 * and log back in with those credentials.
 */
test("a parent can log in and reach their dashboard", async ({ page, context }) => {
  const creds = await signUpAndEnterChild(page);

  // Drop the session, then log in fresh.
  await context.clearCookies();
  await page.goto("/login");

  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password").fill(creds.password);
  await page.getByRole("button", { name: /log in/i }).click();

  await expect(page).toHaveURL(/\/parent/);
  await expect(page.getByText(/your learners/i)).toBeVisible();
});

test("bad credentials show a friendly message, not a technical error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrong-password-123");
  await page.getByRole("button", { name: /log in/i }).click();

  // Stays on login and shows an alert (no stack traces / status codes).
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
