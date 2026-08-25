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
  // Journeys hit a remote (serverless) Postgres, so per-request latency is high
  // in dev; a generous ceiling keeps multi-step flows (e.g. completing a whole
  // mission) reliable. Co-located with the DB these finish in a few seconds.
  timeout: 180_000,
  // Web-first assertions auto-wait; the default (5s) is far shorter than a data
  // fetch against the remote serverless DB in dev (which, behind the Vite proxy
  // and tsx-watch, can take 20s+). Give assertions headroom so they wait for the
  // data rather than failing spuriously. In a normal environment these resolve
  // in well under a second.
  expect: { timeout: 45_000 },
  // These journeys are DB-backed and share one pooled Neon connection, so they
  // run serially (a single worker). Parallel workers contend for connections and
  // cause spurious timeouts; correctness — not throughput — is the goal here.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    // TechQuest's primary target is a 1440×900 desktop; test at that viewport so
    // responsive, breakpoint-gated UI (e.g. the xl-only rewards panel) is in the
    // same state real users see.
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
