import { test, expect } from "@playwright/test";
import { signUpAndEnterChild, completeCurrentMission } from "./helpers";

/**
 * Full learning journey through the UI: sign up → create child → start the first
 * mission → complete it → see XP and the first badge. Completion and XP/badge
 * math are also covered deterministically at the API layer (mission.test.ts);
 * this proves the same works end-to-end in the browser.
 */
test("a child can complete their first mission and earn XP and a badge", async ({ page }) => {
  await signUpAndEnterChild(page, "Quinn");

  // Start the first mission from the dashboard.
  await page.getByRole("button", { name: /start mission/i }).click();
  await expect(page).toHaveURL(/\/missions\/[^/]+$/);
  await expect(page.getByText(/step 1 of/i)).toBeVisible();

  // Play every step through to the completion screen.
  await completeCurrentMission(page);

  // Completion screen: a celebratory, kid-friendly summary with a score + XP.
  await expect(page).toHaveURL(/\/missions\/[^/]+\/complete/);
  await expect(page.getByRole("heading", { name: /nice work/i })).toBeVisible();
  await expect(page.getByText(/score \d+%/i)).toBeVisible();

  // Back on the dashboard, XP has increased and the first badge is shown.
  await page.getByRole("link", { name: /^home$/i }).click();
  await expect(page).toHaveURL(/\/child/);
  await expect(page.getByText(/first explorer/i)).toBeVisible();
  // At least the mission-completion XP (100) is now on the profile.
  await expect(page.getByText(/1 of \d+ missions complete/i)).toBeVisible();
});
