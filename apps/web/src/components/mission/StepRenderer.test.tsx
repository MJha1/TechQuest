import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ServedStep, AnswerResult } from "@techquest/shared";
import { StepActivity, canSubmit, stepMeta } from "./StepRenderer";

function step(overrides: Partial<ServedStep>): ServedStep {
  return {
    id: "s1",
    missionId: "m1",
    order: 1,
    type: "INTRO",
    title: "Step",
    content: {},
    xpReward: 10,
    ...overrides,
  };
}

const noop = () => {};

describe("stepMeta / canSubmit", () => {
  it("classifies step kinds", () => {
    expect(stepMeta(step({ type: "INTRO" })).kind).toBe("acknowledge");
    expect(stepMeta(step({ type: "CHOICE" })).kind).toBe("graded");
    expect(stepMeta(step({ type: "QUESTION" })).kind).toBe("open");
  });

  it("gates submission on a complete response", () => {
    const choice = step({ type: "CHOICE", content: { prompt: "q", options: [{ id: "a", label: "A" }] } });
    expect(canSubmit(choice, {})).toBe(false);
    expect(canSubmit(choice, { optionId: "a" })).toBe(true);
    // Acknowledge steps are always submittable.
    expect(canSubmit(step({ type: "INTRO" }), {})).toBe(true);
  });
});

describe("StepActivity (data-driven, controlled)", () => {
  it("renders a CHOICE step and reports the chosen option", () => {
    const onChange = vi.fn();
    render(
      <StepActivity
        step={step({
          type: "CHOICE",
          title: "Pick one",
          content: { prompt: "Which helps?", options: [{ id: "a", label: "One photo" }, { id: "b", label: "Many photos" }] },
        })}
        value={{}}
        onChange={onChange}
        disabled={false}
        result={null}
      />,
    );
    fireEvent.click(screen.getByLabelText(/many photos/i));
    expect(onChange).toHaveBeenCalledWith({ optionId: "b" });
  });

  it("shows immediate feedback from a grading result", () => {
    const result: AnswerResult = {
      correct: true,
      feedback: "Because more examples help.",
      xpAwarded: 10,
      step: { missionStepId: "s1", status: "COMPLETED", isCorrect: true, attempts: 1, response: null, completedAt: null },
      child: { xp: 10, level: 1, streak: 0 },
    };
    render(
      <StepActivity
        step={step({ type: "CHOICE", content: { prompt: "q", options: [{ id: "a", label: "A" }] } })}
        value={{ optionId: "a" }}
        onChange={noop}
        disabled
        result={result}
      />,
    );
    expect(screen.getByText(/correct!/i)).toBeInTheDocument();
    expect(screen.getByText(/more examples help/i)).toBeInTheDocument();
  });

  it("reports open-ended text via onChange", () => {
    const onChange = vi.fn();
    render(
      <StepActivity
        step={step({ type: "QUESTION", content: { prompt: "In your words?" } })}
        value={{}}
        onChange={onChange}
        disabled={false}
        result={null}
      />,
    );
    fireEvent.change(screen.getByLabelText(/in your words/i), { target: { value: "lots of photos" } });
    expect(onChange).toHaveBeenCalledWith({ text: "lots of photos" });
  });

  it("renders acknowledge prose and its learning eyebrow", () => {
    render(
      <StepActivity
        step={step({ type: "INTRO", title: "Welcome", content: { heading: "Hi", body: "Let's learn" } })}
        value={{}}
        onChange={noop}
        disabled={false}
        result={null}
      />,
    );
    expect(screen.getByText(/the big idea/i)).toBeInTheDocument();
    expect(screen.getByText("Let's learn")).toBeInTheDocument();
  });
});
