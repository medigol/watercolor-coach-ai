import {
  overlayCategory,
  overlayKind,
  usableOverlays,
  type CoachingOverlay,
} from "./overlays";

export function requiresNewStudy(action: string) {
  return (
    /\b(crop|reframe|repaint|next study|new study)\b/i.test(action) ||
    /\b(move|reposition|relocate|shift|place|position|arrange|resize|enlarge|shrink)\b.{0,45}\b(house|buildings?|figures?|subject|focal (area|point)|horizon|objects?|trees?|shoreline)\b/i.test(
      action,
    ) ||
    /\b(make|paint|draw)\b.{0,35}\b(house|buildings?|figures?|subject|trees?)\b.{0,25}\b(smaller|larger|taller|shorter|wider|narrower)\b/i.test(
      action,
    ) ||
    /\b(increase|decrease|reduce|expand|change|alter|adjust)\b.{0,35}\b(sky|ground|foreground|background|water|land)\b.{0,15}\b(area|proportion|space|height|amount|size)\b/i.test(
      action,
    ) ||
    /\b(change|alter|adjust)\b.{0,25}\b(proportions?|placement|shape balance)\b/i.test(
      action,
    ) ||
    /\b(raise|lower|relocate|change)\b.{0,25}\bhorizon\b/i.test(action)
  );
}

export function coachingTiming(note: CoachingOverlay) {
  if (
    overlayKind(note) === "crop_box" ||
    requiresNewStudy(`${note.shortInstruction} ${note.action}`)
  )
    return "next_study";
  return note.timing ?? null;
}
export function timingLabel(note: CoachingOverlay) {
  const timing = coachingTiming(note);
  return timing === "current_painting"
    ? "Try now on this painting"
    : timing === "next_study"
      ? "Try in the next study"
      : timing === "both"
        ? "Now or in your next study"
        : "Test in a small study first";
}
export function markMeaning(note: CoachingOverlay) {
  if (
    note.type === "reserve_light_mark" ||
    overlayCategory(note) === "reserve_light" ||
    note.styleHint === "preserve_light"
  )
    return "Keep this light clean.";
  switch (overlayKind(note)) {
    case "focal_ring":
      return "This is where the viewer should look first.";
    case "crop_box":
      return "Test this framing in the next study.";
    case "arrow":
      return "Let the eye travel along this path.";
    case "guide_line":
      return "This is the main design structure.";
    case "region_highlight":
      return "Paint this area as a simpler mass.";
    case "value_mass":
      return "Think of this as one connected value shape.";
    case "edge_mark":
      return note.styleHint === "hard"
        ? "Keep this edge firm and selective."
        : "Let this edge soften or disappear.";
    default:
      return "Look here for one painting decision.";
  }
}
const shortText = (value: unknown) =>
  typeof value === "string" && !!value.trim() && value.length <= 350
    ? value.trim()
    : undefined;

export function compositionGuidance({
  decision,
  overlays,
  mainAdvice,
  composition,
}: {
  decision?: unknown;
  overlays?: unknown;
  mainAdvice: string;
  composition: string;
}) {
  const supplied =
    decision && typeof decision === "object" && !Array.isArray(decision)
      ? (decision as Record<string, unknown>)
      : {};
  const notes = usableOverlays(overlays);
  const relevant = notes.filter((note) =>
    [
      "composition",
      "focal_point",
      "simplification",
      "value_structure",
    ].includes(overlayCategory(note)),
  );
  const now = relevant.find((note) =>
    ["current_painting", "both"].includes(coachingTiming(note) ?? ""),
  );
  const next = relevant.find((note) => coachingTiming(note) === "next_study");
  const proposedNow = shortText(supplied.tryNow) ?? now?.action;
  const structuralNow =
    proposedNow && requiresNewStudy(proposedNow) ? proposedNow : undefined;
  return {
    mainIssue: shortText(supplied.mainIssue) ?? mainAdvice,
    reason:
      shortText(supplied.reason) ??
      relevant[0]?.reason ??
      "A clear focal area and quiet supporting shapes help the viewer know where to look.",
    tryNow:
      (structuralNow ? undefined : proposedNow) ??
      "Keep the existing placement. Test a small value or edge change on scrap paper before touching dry paint.",
    nextStudy:
      structuralNow ??
      shortText(supplied.nextStudy) ??
      next?.action ??
      composition,
  };
}
