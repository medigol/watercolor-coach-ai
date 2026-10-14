import type { FeedbackFocus } from "../types";

export type ExploreKey =
  | "visual"
  | "planning"
  | "composition"
  | "colour"
  | "technique"
  | "sketch"
  | "followup"
  | "preparation"
  | "steps";

export function resultFocus(value: unknown): FeedbackFocus {
  return value === "Composition" ||
    value === "Colour & contrast" ||
    value === "Watercolor technique"
    ? value
    : "Overall feedback";
}

export function exploreOrder(focus: FeedbackFocus): ExploreKey[] {
  switch (focus) {
    case "Composition":
      return [
        "composition",
        "planning",
        "visual",
        "colour",
        "technique",
        "sketch",
        "followup",
      ];
    case "Colour & contrast":
      return [
        "colour",
        "planning",
        "visual",
        "composition",
        "technique",
        "sketch",
        "followup",
      ];
    case "Watercolor technique":
      return [
        "technique",
        "planning",
        "visual",
        "composition",
        "colour",
        "sketch",
        "followup",
      ];
    default:
      return [
        "visual",
        "planning",
        "composition",
        "technique",
        "colour",
        "sketch",
        "followup",
      ];
  }
}

export function primaryExploreSection(focus: FeedbackFocus): ExploreKey | null {
  return focus === "Composition"
    ? "composition"
    : focus === "Colour & contrast"
      ? "colour"
      : focus === "Watercolor technique"
        ? "technique"
        : null;
}
