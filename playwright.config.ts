import { defineConfig, devices } from "@playwright/test";

/**
 * Root Playwright config for TechQuest E2E tests.
 *
 * Not part of `npm run test` (unit/integration). To run:
 *   npx playwright install            # one-time: download browsers
 *   # provide the API's env (DB + auth secret), then:
 *   DATABASE_URL=... DIRECT_URL=... BETTER_AUTH_SECRET=... npm run test:e2e
 *
 * The `webServer` below boots the full dev stack (web + api + shared) and waits
 * for the web app before the tests run; it inherits the shell's environment, so
 * the API picks up DATABASE_URL / BETTER_AUTH_SECRET from there.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
