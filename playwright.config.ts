import { defineConfig, devices } from "@playwright/test";

/**
 * Root Playwright config for TechQuest E2E tests.
 *
 * Not part of `npm run test` (unit/integration). Run explicitly with:
 *   npx playwright install   # one-time: download browsers
 *   npm run dev              # in a separate terminal
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
