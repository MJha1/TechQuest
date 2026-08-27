import type { AnswerResult } from "@techquest/shared";

/** The interactive presentations a choice/prediction step can be answered with.
 *  Every template renders the SAME options and emits the SAME `{ optionId }`
 *  response — only the play pattern differs (Wordwall-style "switch template"). */
export type ChoiceTemplateId = "cards" | "flip" | "pop" | "wheel";

export interface ChoiceOption {
  id: string;
  label: string;
  /** Optional emoji sugar from the seed content. */
  emoji?: string;
}

/** Props shared by every choice template. Controlled: `selected` and grading
 *  come from the mission player; the template only draws + calls `onSelect`. */
export interface ChoiceTemplateProps {
  prompt: string;
  options: ChoiceOption[];
  /** Currently selected option id (undefined before the child picks). */
  selected?: string;
  onSelect: (optionId: string) => void;
  /** Freeze inputs once the step has been answered. */
  disabled: boolean;
  /** Grading result for immediate feedback (null before answering). */
  result: AnswerResult | null;
  /** Stable id for grouping inputs / animation keys. */
  stepId: string;
}
