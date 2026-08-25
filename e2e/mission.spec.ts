import { test, expect } from "@playwright/test";
import { signUpAndEnterChild } from "./helpers";

/** Starting a mission from the dashboard opens the mission player. */
test("Start Mission opens the mission player", async ({ page }) => {
  await signUpAndEnterChild(page);

  await page.getByRole("button", { name: /start mission/i }).click();

  await expect(page).toHaveURL(/\/missions\/[^/]+$/);
  await expect(page.getByText(/step 1 of/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /continue|check answer|submit/i }),
  ).toBeVisible();
});

/** Progress advances (and is displayed) as the child moves through steps. */
test("progress display advances through the mission", async ({ page }) => {
  await signUpAndEnterChild(page);
  await page.getByRole("button", { name: /start mission/i }).click();

  await expect(page.getByText(/step 1 of/i)).toBeVisible();

  // The first step is an intro (acknowledge) — Continue advances to step 2.
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByText(/step 2 of/i)).toBeVisible();
});
