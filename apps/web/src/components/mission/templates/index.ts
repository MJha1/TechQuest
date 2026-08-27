import type { ElementType } from "react";
import { LayoutList, Package, CircleDot, Disc3 } from "lucide-react";
import type { ChoiceTemplateId } from "./types";
import { CardsTemplate } from "./CardsTemplate";
import { FlipTilesTemplate } from "./FlipTilesTemplate";
import { BubblePopTemplate } from "./BubblePopTemplate";
import { SpinWheelTemplate } from "./SpinWheelTemplate";

export type { ChoiceTemplateId, ChoiceTemplateProps, ChoiceOption } from "./types";

/** The switchable choice presentations, in display order. `label` mirrors the
 *  Wordwall wording the kids' UI borrows. */
export const CHOICE_TEMPLATES: {
  id: ChoiceTemplateId;
  label: string;
  icon: ElementType;
  Component: (typeof CardsTemplate);
}[] = [
  { id: "cards", label: "Quiz", icon: LayoutList, Component: CardsTemplate },
  { id: "flip", label: "Open the box", icon: Package, Component: FlipTilesTemplate },
  { id: "pop", label: "Bubble pop", icon: CircleDot, Component: BubblePopTemplate },
  { id: "wheel", label: "Spin the wheel", icon: Disc3, Component: SpinWheelTemplate },
];

export const DEFAULT_CHOICE_TEMPLATE: ChoiceTemplateId = "cards";

/** Narrow an arbitrary (e.g. persisted) value to a known template id. */
export function asChoiceTemplate(value: unknown): ChoiceTemplateId {
  return CHOICE_TEMPLATES.some((t) => t.id === value)
    ? (value as ChoiceTemplateId)
    : DEFAULT_CHOICE_TEMPLATE;
}
