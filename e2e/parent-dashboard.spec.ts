import { test, expect } from "@playwright/test";
import { signUpAndEnterChild } from "./helpers";

/**
 * The parent dashboard: a calm, trustworthy overview of the learner — not the
 * gamified child view. We reach it from the child space and check its sections
 * render and that a parent can enter the learning space from it.
 */
test("parent dashboard shows the learner overview and can enter the learning space", async ({ page }) => {
  await signUpAndEnterChild(page, "Rowan");

  await page.goto("/parent");
  await expect(page).toHaveURL(/\/parent/);

  // Educational framing, not gamified.
  await expect(page.getByText(/overview of your learner/i)).toBeVisible();
  await expect(page.getByText(/learning progress/i)).toBeVisible();

  // The parent can drop into the child's space.
  await page.getByRole("button", { name: /enter learning space/i }).first().click();
  await expect(page).toHaveURL(/\/child/);
  await expect(page.getByRole("heading", { name: /hi, rowan/i })).toBeVisible();
});
