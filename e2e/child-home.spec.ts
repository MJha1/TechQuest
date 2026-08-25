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

  // Rewards live in the right rail at the desktop target width (the inline copy
  // is an xl:hidden duplicate); scope to the rewards <aside> to hit the visible one.
  const rewards = page.locator("aside").filter({ hasText: /badges/i });
  await expect(rewards.getByText(/\bXP\b/i).first()).toBeVisible();
  await expect(rewards.getByText(/badges/i)).toBeVisible();

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
