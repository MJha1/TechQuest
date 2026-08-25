import { expect, type Page } from "@playwright/test";

export interface Credentials {
  email: string;
  password: string;
}

/** A unique email so each test run gets a fresh parent account. */
export function uniqueEmail(): string {
  return `e2e+${Date.now()}+${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Sign up a new parent, create a learner, and enter their learning space —
 * leaving the page on the child home dashboard. Returns the parent credentials
 * (useful for exercising login afterwards).
 */
export async function signUpAndEnterChild(page: Page, nickname = "Testly"): Promise<Credentials> {
  const creds: Credentials = { email: uniqueEmail(), password: "playwright-pass-123" };

  await page.goto("/signup");
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password").fill(creds.password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await page.waitForURL("**/create-child");
  await page.getByLabel("Nickname").fill(nickname);
  // Age range select defaults to a valid value; leave as-is.
  await page.getByRole("button", { name: /create profile/i }).click();

  await page.waitForURL("**/parent");
  await page.getByRole("button", { name: /enter/i }).first().click();

  await page.waitForURL("**/child");
  await expect(page.getByRole("heading", { name: new RegExp(`hi, ${nickname}`, "i") })).toBeVisible();

  return creds;
}
