import { test, expect } from "@playwright/test";

/** The public landing page renders and offers the primary signup CTA. */
test("landing page shows the value proposition and a signup CTA", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /become ai-ready by learning through play and building/i }),
  ).toBeVisible();

  // Primary CTA leads to signup.
  const tryCta = page.getByRole("link", { name: /try techquest/i }).first();
  await expect(tryCta).toBeVisible();
  await tryCta.click();
  await expect(page).toHaveURL(/\/signup/);
});
