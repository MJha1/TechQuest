import type { z } from "zod";
import {
  AnotherExampleInputSchema,
  CompareAnswersInputSchema,
  ShouldVerifyInputSchema,
  ImprovePromptInputSchema,
  type AnotherExampleInput,
  type CompareAnswersInput,
  type ShouldVerifyInput,
  type ImprovePromptInput,
  type ActivityInfo,
  type ActivityResult,
} from "@techquest/shared";
import { normalizeAndCap, runAiText } from "../services/ai.service.js";
import type { AIProvider } from "./provider.js";

/**
 * Controlled AI learning activities.
 *
 * Each activity is a narrow, single-purpose learning tool with a fixed prompt
 * template and strict, bounded input — NOT an open chatbot. There is deliberately
 * NO free-form message field, NO conversation memory, NO tools, NO web browsing,
 * and NO image generation. The AI never gives personal advice or social chat.
 *
 * Every activity carries the six required pieces:
 *   objective · controlled input (schema) · prompt template · output validation
 *   · maximum output length · fallback.
 */

// A safety preamble prepended to every activity's system prompt.
const SAFE_PREAMBLE = [
  "You are a safe, friendly learning helper for children aged 8 to 12.",
  "Keep every reply short, simple, positive, and strictly on the learning task.",
  "Never ask for or use personal information.",
  "Never give personal, social, medical, legal, or safety advice.",
  "Do not chat about unrelated topics and do not include links.",
].join(" ");

interface AiActivity<TInput> {
  key: string;
  title: string;
  /** Learning objective. */
  objective: string;
  /** Controlled input schema (bounded, strict). */
  inputSchema: z.ZodType<TInput>;
  /** Public field descriptors (for the catalog / UI). */
  inputFields: { name: string; label: string; maxLength: number }[];
  /** System prompt (server-only). */
  system: string;
  /** Prompt template. */
  buildPrompt: (input: TInput) => string;
  /** Maximum output length. */
  maxOutputChars: number;
  maxOutputTokens: number;
  /** Fallback shown when the model can't produce a usable reply. */
  fallback: string;
}

function activity<T>(a: AiActivity<T>): AiActivity<T> {
  return a;
}

// 1. Ask AI for another example ------------------------------------------------
const anotherExample = activity<AnotherExampleInput>({
  key: "another_example",
  title: "Ask for another example",
  objective: "See how AI can offer more examples of an idea — and that examples aren't always perfect.",
  inputSchema: AnotherExampleInputSchema,
  inputFields: [{ name: "concept", label: "What do you want another example of?", maxLength: 120 }],
  system: `${SAFE_PREAMBLE} Give ONE short, age-appropriate example. Just the example, no explanation.`,
  buildPrompt: (i) =>
    `Give one more simple, kid-friendly example of: "${i.concept}". Reply with just one short example sentence.`,
  maxOutputChars: 160,
  maxOutputTokens: 80,
  fallback: "Try thinking of one more example yourself — what else fits this idea?",
});

// 2. Compare two AI answers ----------------------------------------------------
const compareAnswers = activity<CompareAnswersInput>({
  key: "compare_answers",
  title: "Compare two answers",
  objective: "Learn that AI can give different answers, and practice spotting which is clearer and more helpful.",
  inputSchema: CompareAnswersInputSchema,
  inputFields: [
    { name: "question", label: "The question", maxLength: 300 },
    { name: "answerA", label: "Answer A", maxLength: 400 },
    { name: "answerB", label: "Answer B", maxLength: 400 },
  ],
  system: `${SAFE_PREAMBLE} Help the child compare two answers. Point out how they differ and what makes an answer clear and helpful. Do NOT just declare a winner — help them think.`,
  buildPrompt: (i) =>
    [
      `Question: "${i.question}"`,
      `Answer A: "${i.answerA}"`,
      `Answer B: "${i.answerB}"`,
      "In one or two simple sentences, help a child notice how these two answers are different and what makes an answer clear and helpful.",
    ].join("\n"),
  maxOutputChars: 260,
  maxOutputTokens: 150,
  fallback:
    "Compare them yourself: which answer is easier to understand, and which gives more helpful detail?",
});

// 3. Decide whether an AI answer should be verified ----------------------------
const shouldVerify = activity<ShouldVerifyInput>({
  key: "should_verify",
  title: "Should you double-check this?",
  objective: "Build the habit of checking AI answers, especially surprising or important claims.",
  inputSchema: ShouldVerifyInputSchema,
  inputFields: [{ name: "claim", label: "What did the AI say?", maxLength: 400 }],
  system: `${SAFE_PREAMBLE} Help the child decide whether to double-check a claim and suggest one safe way to check (a trusted grown-up or a book). Encourage healthy checking. Do NOT declare the claim definitely true or false.`,
  buildPrompt: (i) =>
    `A child saw this answer from an AI: "${i.claim}". In one or two simple sentences, help them decide whether they should double-check it, and suggest one safe way to check.`,
  maxOutputChars: 260,
  maxOutputTokens: 150,
  fallback:
    "When an answer is surprising or important, it's smart to check it with a trusted grown-up or a book.",
});

// 4. Improve a simple prompt ---------------------------------------------------
const improvePrompt = activity<ImprovePromptInput>({
  key: "improve_prompt",
  title: "Make your instruction clearer",
  objective: "Learn that clearer, more specific instructions get better results.",
  inputSchema: ImprovePromptInputSchema,
  inputFields: [{ name: "prompt", label: "Your instruction for the AI", maxLength: 300 }],
  system: `${SAFE_PREAMBLE} Rewrite the child's instruction to be ONE clearer, more specific, friendly instruction. Only give the improved instruction — do not answer it or do the task.`,
  buildPrompt: (i) =>
    `A child wrote this instruction for an AI: "${i.prompt}". Rewrite it as one clearer, more specific instruction they could use. Keep it short and friendly, and only give the improved instruction.`,
  maxOutputChars: 220,
  maxOutputTokens: 120,
  fallback:
    "Try adding more detail: say exactly what you want, how long it should be, and who it's for.",
});

const ACTIVITY_LIST = [anotherExample, compareAnswers, shouldVerify, improvePrompt];
export const AI_ACTIVITIES: Record<string, AiActivity<any>> = Object.fromEntries(
  ACTIVITY_LIST.map((a) => [a.key, a]),
);

/** Public catalog (no prompts/system leak to the client). */
export function listActivities(): ActivityInfo[] {
  return ACTIVITY_LIST.map((a) => ({
    key: a.key,
    title: a.title,
    objective: a.objective,
    inputs: a.inputFields,
  }));
}

/** Run one activity with the shared safeguards (timeout, validation, fallback). */
export async function runActivity(
  provider: AIProvider,
  activityDef: AiActivity<any>,
  input: unknown,
): Promise<ActivityResult> {
  const { text, source } = await runAiText(provider, {
    system: activityDef.system,
    prompt: activityDef.buildPrompt(input),
    maxOutputTokens: activityDef.maxOutputTokens,
    validate: (raw) => normalizeAndCap(raw, activityDef.maxOutputChars),
    fallback: activityDef.fallback,
  });
  return { activity: activityDef.key, text, source };
}
