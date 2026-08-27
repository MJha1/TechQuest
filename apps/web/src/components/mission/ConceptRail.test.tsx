import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConceptRail, splitConceptStages, conceptStageIndex } from "./ConceptRail";

describe("concept journey helpers", () => {
  it("splits an arrow concept into stages", () => {
    expect(splitConceptStages("Examples → Patterns → Prediction")).toEqual([
      "Examples",
      "Patterns",
      "Prediction",
    ]);
    expect(splitConceptStages("Recommendations")).toEqual(["Recommendations"]);
  });

  it("maps step progress to the right stage", () => {
    // 9 steps, 3 stages → thirds.
    expect(conceptStageIndex(0, 9, 3)).toBe(0);
    expect(conceptStageIndex(4, 9, 3)).toBe(1);
    expect(conceptStageIndex(8, 9, 3)).toBe(2);
  });
});

describe("ConceptRail", () => {
  it("renders each stage of a multi-stage concept", () => {
    render(<ConceptRail concept="Examples → Patterns → Prediction" stepIndex={4} stepCount={9} />);
    expect(screen.getByText("Examples")).toBeInTheDocument();
    expect(screen.getByText("Patterns")).toBeInTheDocument();
    expect(screen.getByText("Prediction")).toBeInTheDocument();
  });

  it("renders nothing for a single-stage concept", () => {
    const { container } = render(<ConceptRail concept="Recommendations" stepIndex={0} stepCount={5} />);
    expect(container).toBeEmptyDOMElement();
  });
});
