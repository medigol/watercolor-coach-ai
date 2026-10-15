import {
  explicitGuidanceDomain,
  type FeedbackDomain,
} from "../shared/visualMetadata";
import {
  conflictsWithDecision,
  type CoachingDecision,
} from "./coachingDecision";
import type { FeedbackFocus } from "../types";

export function guidanceDomain(
  text: unknown,
  fallback: FeedbackDomain,
): FeedbackDomain {
  return typeof text === "string"
    ? (explicitGuidanceDomain(text) ?? fallback)
    : fallback;
}

// A physical recipe and a design decision can describe the same hierarchy.
// Prefer the supplied explanation belonging to the chosen focus; do not invent
// a new image observation when an old result lacks that explanation.
export function focusedMainAdvice(
  advice: string,
  decision: CoachingDecision | null,
  focus: FeedbackFocus,
): {
  text: string;
  relatedDomain?: FeedbackDomain;
} {
  const detected = explicitGuidanceDomain(advice);
  const expected =
    focus === "Composition"
      ? "composition"
      : focus === "Colour & contrast"
        ? "colour_value"
        : focus === "Watercolor technique"
          ? "technique"
          : "overall";
  if (!detected || expected === "overall" || detected === expected)
    return { text: advice };
  const alternative =
    expected === "composition"
      ? decision?.compositionImplication
      : expected === "colour_value"
        ? decision?.colourImplication
        : decision?.techniqueImplication;
  if (
    alternative &&
    (!explicitGuidanceDomain(alternative) ||
      explicitGuidanceDomain(alternative) === expected) &&
    (!decision || !conflictsWithDecision(alternative, decision))
  )
    return { text: alternative, relatedDomain: detected };
  return {
    text: "This saved coaching point concerns a different focus. The full note is available in the study details below.",
    relatedDomain: detected,
  };
}
