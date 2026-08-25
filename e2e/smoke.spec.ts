import { test, expect } from "@playwright/test";

/**
 * Placeholder E2E smoke test. Skipped by default so `npm run test:e2e` passes
 * without a running dev server or installed browsers. Un-skip once the app has
 * real pages to exercise (and after `npx playwright install`).
 */
test.skip("home page shows the TechQuest brand", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /techquest/i })).toBeVisible();
});
