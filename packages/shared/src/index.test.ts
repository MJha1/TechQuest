import { describe, it, expect } from "vitest";
import {
  APP_NAME,
  AgeBand,
  MissionStepType,
  HealthSchema,
  CreateChildSchema,
  UpdateChildSchema,
  SubmitAnswerSchema,
  AIHintRequestSchema,
  apiResponseSchema,
  ChildSchema,
} from "./index.js";

describe("shared contracts", () => {
  it("exposes the app name", () => {
    expect(APP_NAME).toBe("TechQuest");
  });

  it("validates a well-formed health payload", () => {
    expect(HealthSchema.parse({ status: "ok", service: "api" }).service).toBe(
      "api",
    );
  });

  it("enumerates all mission step types", () => {
    expect(MissionStepType.options).toContain("DRAG_DROP");
    expect(MissionStepType.options).toHaveLength(8);
  });
});

describe("command schemas", () => {
  it("accepts a minimal child and rejects unknown/PII fields", () => {
    expect(
      CreateChildSchema.parse({ nickname: "Nova", ageBand: "AGE_8_9" }).nickname,
    ).toBe("Nova");

    // Unknown keys (e.g. a real name) are rejected by .strict().
    expect(() =>
      CreateChildSchema.parse({
        nickname: "Nova",
        ageBand: "AGE_8_9",
        fullName: "Real Name",
      }),
    ).toThrow();
  });

  it("requires at least one field to update a child", () => {
    expect(() => UpdateChildSchema.parse({})).toThrow();
    expect(UpdateChildSchema.parse({ avatar: "fox" }).avatar).toBe("fox");
  });

  it("accepts a free-form answer response", () => {
    const parsed = SubmitAnswerSchema.parse({
      missionStepId: "clx1234567890abcdefghijklm",
      response: { choice: "a", correct: true },
    });
    expect(parsed.response).toEqual({ choice: "a", correct: true });
  });

  it("bounds AI hint questions", () => {
    expect(() =>
      AIHintRequestSchema.parse({
        missionId: "clx1234567890abcdefghijklm",
        missionStepId: "clx1234567890abcdefghijklm",
        question: "x".repeat(500),
      }),
    ).toThrow();
  });
});

describe("api response envelope", () => {
  it("validates a success envelope for a given data schema", () => {
    const schema = apiResponseSchema(ChildSchema);
    const result = schema.safeParse({
      ok: true,
      data: {
        id: "child_1",
        parentId: "user_1",
        nickname: "Nova",
        ageBand: "AGE_8_9",
        avatar: null,
        level: 1,
        xp: 0,
        streak: 0,
        longestStreak: 0,
        lastActiveAt: null,
        createdAt: "2026-08-25T00:00:00.000Z",
        updatedAt: "2026-08-25T00:00:00.000Z",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates a failure envelope", () => {
    const schema = apiResponseSchema(ChildSchema);
    const result = schema.safeParse({
      ok: false,
      error: { code: "NOT_FOUND", message: "No such child" },
    });
    expect(result.success).toBe(true);
  });
});
