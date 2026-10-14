import {
  overlayCategory,
  overlayKind,
  usableOverlays,
  type CoachingOverlay,
} from "./overlays";

const sentences = (value: unknown): string[] =>
  typeof value === "string"
    ? value
        .trim()
        .split(/(?<=[.!?])\s+|\r?\n+/)
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

export function conciseText(value: unknown, maxSentences = 1): string {
  const count =
    Number.isInteger(maxSentences) && maxSentences > 0
      ? Math.min(maxSentences, 3)
      : 1;
  return sentences(value).slice(0, count).join(" ");
}

const guidanceKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s\p{P}]+/gu, " ")
    .trim();
export function uniqueGuidance(
  items: readonly unknown[],
  previous: readonly unknown[] = [],
): string[] {
  const seen = new Set(
    previous
      .filter((item): item is string => typeof item === "string")
      .map(guidanceKey),
  );
  return items
    .filter((item): item is string => {
      if (typeof item !== "string" || !item.trim()) return false;
      const key = guidanceKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => item.trim());
}

// Presentation safeguards are applied only after an explicit study-mode flag.
// They omit conflicting sentences instead of inventing positive observations.
export function studyText(value: unknown, fallback?: string): string {
  const harsh =
    /\b(main (?:issue|problem|fault)|problem|mistake|fault|weak(?:ens?|er|ness)?|wrong|poor|bad|incorrect|overwork\w*|too\s+\w+|distract\w*|compet(?:e|es|ing)|clutter\w*|messy|must|should|fix\w*|correct\w*|repair\w*|lack(?:s|ing)?|needs? (?:improvement|correction|work|more|less|simpler|stronger|better|fewer))\b/i;
  const directChange =
    /^(?:please\s+)?(?:reduce|simplify|strengthen|sharpen|soften|move|reposition|shift|connect|darken|lighten|lower|raise|crop|remove|add|avoid|stop|paint|draw|reserve|keep|use|wait|let|try|make|glaze|lift|scrub|change|adjust|group|merge|repaint|recover|balance|quiet|increase|decrease)\b/i;
  const optionalStudy =
    /^(?:optional|one (?:possible|optional) (?:variation|experiment|refinement)|a (?:possible|separate) (?:variation|experiment)|if you (?:wish|choose|want)|you (?:could|might)|(?:in|for|on) (?:a|your|the) (?:separate|next|small|new) study)\b/i;
  const kept = sentences(value).filter((part) => {
    const instruction = part.replace(
      /^(?:for your study|study note|your study):\s*/i,
      "",
    );
    return (
      !harsh.test(part) &&
      (!directChange.test(instruction) || optionalStudy.test(part))
    );
  });
  return (
    kept.join(" ") ||
    (fallback ??
      "Use this as a study of painting decisions and optional variations on a separate sheet.")
  );
}

export function requiresNewStudy(action: string) {
  const forms: Record<string, string> = {
    moving: "move",
    moved: "move",
    moves: "move",
    repositioning: "reposition",
    repositioned: "reposition",
    relocating: "relocate",
    relocated: "relocate",
    shifting: "shift",
    shifted: "shift",
    placing: "place",
    placed: "place",
    positioning: "position",
    positioned: "position",
    resizing: "resize",
    resized: "resize",
    enlarging: "enlarge",
    enlarged: "enlarge",
    shrinking: "shrink",
    shrunk: "shrink",
    making: "make",
    made: "make",
    changing: "change",
    changed: "change",
    adjusting: "adjust",
    adjusted: "adjust",
    raising: "raise",
    raised: "raise",
    lowering: "lower",
    lowered: "lower",
    increasing: "increase",
    increased: "increase",
    decreasing: "decrease",
    decreased: "decrease",
    simplifying: "simplify",
    simplified: "simplify",
    merging: "merge",
    merged: "merge",
    removing: "remove",
    removed: "remove",
    redesigning: "redesign",
    redesigned: "redesign",
    redistributing: "redistribute",
    redistributed: "redistribute",
    widening: "widen",
    widened: "widen",
    narrowing: "narrow",
    narrowed: "narrow",
    expanding: "expand",
    expanded: "expand",
    compressing: "compress",
    compressed: "compress",
    rebalancing: "rebalance",
    rebalanced: "rebalance",
    reshaping: "reshape",
    reshaped: "reshape",
  };
  const normalized = action.replace(/\b[a-z]+\b/gi, (word, offset) => {
    const lower = word.toLowerCase();
    // Eye/gaze movement describes viewing, rather than relocating painted shapes.
    if (
      /^mov(?:e|ed|es|ing)$/.test(lower) &&
      /\b(eye|gaze|attention)\s+(?:is\s+|was\s+)?$/i.test(
        action.slice(0, offset),
      )
    )
      return "travel";
    return forms[lower] ?? word;
  });
  return (
    /\b(crop|cropping|reframe|reframing|repaint|repainting|next study|new study)\b/i.test(
      normalized,
    ) ||
    /\b(move|reposition|relocate|shift|place|position|arrange|resize|enlarge|shrink|remove)\b.{0,45}\b(house|buildings?|figures?|subject|focal (area|point)|horizon|objects?|trees?|shoreline|boats?|roofs?|windows?|clouds?)\b/i.test(
      normalized,
    ) ||
    /\b(make|paint|draw)\b.{0,35}\b(house|buildings?|figures?|subject|trees?)\b.{0,25}\b(smaller|larger|taller|shorter|wider|narrower)\b/i.test(
      normalized,
    ) ||
    /\b(increase|decrease|reduce|expand|change|alter|adjust)\b.{0,35}\b(sky|ground|foreground|background|water|land)\b.{0,15}\b(area|proportion|space|height|amount|size)\b/i.test(
      normalized,
    ) ||
    /\b(change|alter|adjust)\b.{0,25}\b(proportions?|placement|shape balance)\b/i.test(
      normalized,
    ) ||
    /\b(raise|lower|relocate|change)\b.{0,25}\bhorizon\b/i.test(normalized) ||
    /\b(change|alter|adjust|increase|decrease|reduce|widen|narrow|compress|expand|redesign|redistribute|rebalance)\b.{0,60}\b(spacing|separation|gaps?|proportions?|placement|shape balance|value (?:design|mass(?:es)?|structure)|layout)\b/i.test(
      normalized,
    ) ||
    /\b(simplify|merge|remove|reshape|reorganize|rearrange|change|redesign)\b.{0,45}\b(big|large|major|dominant)\b.{0,25}\b(shapes?|mass(?:es)?|forms?|design)\b/i.test(
      normalized,
    )
  );
}

export function currentActionSafe(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim() || requiresNewStudy(value))
    return false;
  if (
    /\b(scrub\w*|lift\w*|erase|rub|rework|overpaint|soak|rewet\w*|re-wet\w*|scrape|gesso|opaque)\b/i.test(
      value,
    )
  )
    return false;
  const clauses = sentences(value).flatMap((part) =>
    part.split(
      /;\s*|\s+(?:and then|then|and)\s+(?=(?:paint|add|connect|soften|darken|lighten|sharpen|reduce|change|adjust|alter|improve|fix|correct|enhance|stop|keep|glaze|test|wait)\b)/i,
    ),
  );
  return clauses.every(
    (part) =>
      /\b(stop|avoid)\b.{0,30}\b(add(?:ing)?|more|extra)\b.{0,25}\b(detail|marks?|darks?)\b/i.test(
        part,
      ) ||
      /\bkeep\b.{0,20}\bexisting\b.{0,20}\bplacement\b/i.test(part) ||
      /\btest\b.{0,60}\b(scrap|separate sheet|practice sheet)\b/i.test(part) ||
      (/\bsoften\b/i.test(part) &&
        (/\b(if|while|still|possible|damp|carefully)\b/i.test(part) ||
          /\btest(?:ing|ed)?\b.{0,35}\bscrap\b/i.test(part))) ||
      (/\b(reduce|mute|quiet)\b.{0,35}\bcontrast\b|\bglaze\b/i.test(part) &&
        /\b(light|pale|small|if|test|practical|scrap|carefully)\b/i.test(
          part,
        )) ||
      (/\bconnect\b.{0,45}\b(shadows?|darks?)\b/i.test(part) &&
        /\b(small|carefully|test|scrap|damp)\b/i.test(part)) ||
      /\b(sharpen|add|keep)\b.{0,45}\b(one|small|selective)\b.{0,35}\b(focal|accent)\b/i.test(
        part,
      ) ||
      /\bkeep\b.{0,30}\bfocal accents?\b.{0,20}\bselective\b/i.test(part) ||
      /\bwait\b.{0,35}\b(dry|damp|shine)\b/i.test(part),
  );
}

export function coachingTiming(note: CoachingOverlay) {
  if (
    overlayKind(note) === "crop_box" ||
    requiresNewStudy(`${note.shortInstruction} ${note.action}`)
  )
    return "next_study";
  if (note.timing === "next_study") return "next_study";
  return currentActionSafe(note.action) ? (note.timing ?? null) : null;
}
export function timingLabel(note: CoachingOverlay, study = false) {
  if (study) return "Optional next study variation";
  const timing = coachingTiming(note);
  return timing === "current_painting"
    ? "Try now on this painting"
    : timing === "next_study"
      ? "Try in the next study"
      : timing === "both"
        ? "Now or in your next study"
        : "Test in a small study first";
}
export function markMeaning(note: CoachingOverlay, study = false) {
  if (study) {
    if (overlayCategory(note) === "reserve_light")
      return "Observe the role of this light shape in the wider value design.";
    switch (overlayKind(note)) {
      case "focal_ring":
        return "Observe how focal placement and nearby contrast guide attention.";
      case "crop_box":
        return "Compare this possible frame in a separate study.";
      case "arrow":
        return "Follow this marked path and compare how the eye moves.";
      case "guide_line":
        return "Study the relationship between this line and the larger shapes.";
      case "region_highlight":
        return "Study how this area relates to the surrounding masses.";
      case "value_mass":
        return "Compare this value group with nearby light and dark shapes.";
      case "edge_mark":
        return "Observe this edge beside softer or firmer edges.";
      default:
        return "Look here for a painting decision to study.";
    }
  }
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
  study = false,
}: {
  decision?: unknown;
  overlays?: unknown;
  mainAdvice: string;
  composition: string;
  study?: boolean;
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
  if (study)
    return {
      mainIssue: studyText(
        shortText(supplied.mainIssue) ?? composition,
        "Study how the large shapes, values, and edges relate.",
      ),
      reason: studyText(
        shortText(supplied.reason) ?? relevant[0]?.reason,
        "Compare the focal area with its supporting shapes and edges.",
      ),
      tryNow: "",
      nextStudy: studyText(
        shortText(supplied.nextStudy) ?? next?.action ?? composition,
        "If useful, test one different arrangement in a small separate study.",
      ),
    };
  const mainIssue = shortText(supplied.mainIssue);
  return {
    mainIssue:
      mainIssue && guidanceKey(mainIssue) !== guidanceKey(mainAdvice)
        ? mainIssue
        : "See the main priority above.",
    reason:
      shortText(supplied.reason) ??
      relevant[0]?.reason ??
      "A clear focal area and quiet supporting shapes help the viewer know where to look.",
    tryNow:
      (proposedNow && currentActionSafe(proposedNow)
        ? proposedNow
        : undefined) ??
      "Keep the existing placement. Test a small value or edge change on scrap paper before touching dry paint.",
    nextStudy:
      structuralNow ??
      shortText(supplied.nextStudy) ??
      next?.action ??
      composition,
  };
}
