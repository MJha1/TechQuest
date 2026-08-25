/**
 * Mission content validator CLI — `npm run validate:content`.
 *
 * Validates the seed content in ../prisma/content.ts and exits non-zero if
 * anything is invalid, so bad content can never be seeded (or merged). Runs
 * offline: it imports only the data (no database, no network).
 */
import { missions, badges } from "../prisma/content.js";
import { validateContent } from "./validate.js";

const errors = validateContent(missions, badges);

if (errors.length > 0) {
  console.error(`\n❌ Content is INVALID — ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error("");
  process.exit(1);
}

const steps = missions.reduce((n, m) => n + m.steps.length, 0);
console.log(`✅ Content is valid: ${missions.length} missions, ${steps} steps, ${badges.length} badges.`);
