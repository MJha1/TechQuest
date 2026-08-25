import { test, expect } from "@playwright/test";
import { signUpAndEnterChild } from "./helpers";

/** The child home dashboard shows the greeting, rewards, and the primary CTA. */
test("child home shows greeting, rewards, mission and Start Mission", async ({ page }) => {
  await signUpAndEnterChild(page, "Milo");

  // Greeting.
  await expect(page.getByRole("heading", { name: /hi, milo/i })).toBeVisible();

  // Today's mission + primary CTA.
  await expect(page.getByText(/today's mission/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /start mission/i })).toBeVisible();

  // Rewards: XP, level, streak, badges (all present, kid-friendly).
  await expect(page.getByText(/\bXP\b/).first()).toBeVisible();
  await expect(page.getByText(/level/i).first()).toBeVisible();
  await expect(page.getByText(/badges/i).first()).toBeVisible();

  // Progress summary.
  await expect(page.getByText(/missions complete/i)).toBeVisible();
});

/** The child must never see internal/technical details on the dashboard. */
test("child home hides technical details", async ({ page }) => {
  await signUpAndEnterChild(page);
  const body = (await page.locator("body").innerText()).toLowerCase();

  for (const term of ["childmission", "parentid", "session", "endpoint", "undefined", "null"]) {
    expect(body).not.toContain(term);
  }
});
