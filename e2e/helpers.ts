import { expect, type Page } from "@playwright/test";

export interface Credentials {
  email: string;
  password: string;
}

/** A unique email so each test run gets a fresh parent account. */
export function uniqueEmail(): string {
  return `e2e+${Date.now()}+${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Sign up a new parent and create a learner. The onboarding flow lands directly
 * on the child's home dashboard (Landing → Signup → Create Child → Child Home),
 * so this leaves the page on `/child`. Returns the parent credentials (useful
 * for exercising login afterwards).
 */
export async function signUpAndEnterChild(page: Page, nickname = "Testly"): Promise<Credentials> {
  const creds: Credentials = { email: uniqueEmail(), password: "playwright-pass-123" };

  await page.goto("/signup");
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password").fill(creds.password);
  await page.getByRole("button", { name: /continue/i }).click();

  await page.waitForURL("**/create-child");
  await page.getByLabel("Nickname").fill(nickname);
  // Age range defaults to a valid band; interests are optional. Submit.
  await page.getByRole("button", { name: /start learning/i }).click();

  // The new flow drops the parent straight into the child's space.
  await page.waitForURL("**/child");
  await expect(
    page.getByRole("heading", { name: new RegExp(`hi, ${nickname}`, "i") }),
  ).toBeVisible();

  return creds;
}

/**
 * Fill whatever the current mission step needs so it can be submitted. Answers
 * do not have to be correct — completion (and the First Explorer badge) only
 * needs each step answered. Intro/acknowledge steps need nothing.
 */
async function fillCurrentStep(page: Page): Promise<void> {
  // Single-choice (CHOICE / PREDICTION): pick the first option if none chosen.
  const radios = page.getByRole("radio");
  if ((await radios.count()) > 0) {
    const anyChecked = await radios.evaluateAll((els) =>
      els.some((e) => (e as HTMLInputElement).checked),
    );
    if (!anyChecked) await radios.first().check().catch(() => {});
  }

  // DRAG_DROP renders one <select> per item — assign a real option to each.
  const selects = page.locator("select");
  for (let i = 0; i < (await selects.count()); i++) {
    const sel = selects.nth(i);
    if (await sel.isEditable().catch(() => false)) {
      await sel.selectOption({ index: 1 }).catch(() => {});
    }
  }

  // Open-ended (QUESTION / CHALLENGE / REFLECTION): type something.
  const boxes = page.getByRole("textbox");
  for (let i = 0; i < (await boxes.count()); i++) {
    const box = boxes.nth(i);
    if ((await box.inputValue().catch(() => "x")) === "") {
      await box.fill("I think it is about spotting patterns.");
    }
  }
}

/**
 * Drive the mission player from the current step to the completion screen.
 * Handles the two-click graded pattern (Check answer → feedback → Continue)
 * naturally by looping on the primary action until the URL reaches /complete.
 */
export async function completeCurrentMission(page: Page): Promise<void> {
  for (let guard = 0; guard < 40; guard++) {
    if (page.url().includes("/complete")) return;
    await fillCurrentStep(page);
    await page
      .getByRole("button", { name: /continue|check answer|submit|finish mission/i })
      .last()
      .click();
    await page.waitForTimeout(250); // allow grading/transition to settle
  }
  throw new Error("mission did not reach the completion screen");
}
