import type { PaintingInsight } from "./paintingAnalysis.ts";

// Conservative English presentation guards, not another analysis of the image.
// Only supplied advice is suppressed/ranked; no replacement diagnosis is made.
const clauses = (text: string) =>
  text
    .split(/[.!?;]|\b(?:but|while)\b/i)
    .map((c) => c.split(/\bagainst\b/i)[0]);
const amplification =
  /\b(?:darken|sharpen|strengthen|intensify|saturate|heighten|accentuate|reinforce|emphasi[sz](?:e|ing))\b|\b(?:increase|add|boost|enhance|introduce|raise)\b[^.!?;]{0,50}\b(?:dark\w*|contrast|sharp\w*|chroma|saturation|prominence|visibility)\b|\b(?:darker|sharper|stronger|more (?:contrast|saturated))\b/i;
const explicitLimit =
  /\b(?:keep\w*|remain\w*|stay\w*|retain\w*|limit\w*)\b[^.!?;]{0,100}\b(?:below|less than|lower than|subordinate to|quieter than|without exceeding)\b[^.!?;]{0,50}\b(?:focal|foreground|subject|vehicle|van|boat)\b/i;
const limitedToHierarchy = (action: string, context: string) =>
  explicitLimit.test(action) ||
  explicitLimit.test(context) ||
  /\b(?:below|lower than|subordinate to)\b[^.!?;]{0,35}\bfocal (?:contrast|hierarchy|chroma|sharpness)\b/i.test(
    action,
  );

/** Unsafe generic recession/lead-in amplification is not a major opportunity. */
export function unsafeHierarchyAdvice(
  action: string,
  context: string,
): boolean {
  const amplified = clauses(action).filter((c) => amplification.test(c));
  const depth = /\b(?:recede\w*|recession|depth|atmospher\w*)\b/i.test(
    `${action} ${context}`,
  );
  const background = amplified.some((c) =>
    /\b(?:distant|background|mountains?|far[- ]off)\b/i.test(c),
  );
  if (depth && background && !limitedToHierarchy(action, context)) return true;
  const road = amplified.some((c) =>
    /\b(?:road|street|path|lead[- ]in|directional edge|cent(?:re|er)[- ]?line)\b/i.test(
      c,
    ),
  );
  if (!road) return false;
  // A foreground cue is not permission to strengthen an entire receding path.
  return !(
    /\b(?:near(?:er)?|foreground|lower)\b/i.test(action) &&
    /\b(?:taper\w*|fade\w*|quieter|soften\w*|reduc\w*)\b[^.!?;]{0,60}\b(?:distance|recede\w*|recession|toward|background|focal)\b/i.test(
      action,
    ) &&
    limitedToHierarchy(action, context)
  );
}

/** Keep only supplied preservation when a strength also proposes unsafe emphasis.
 * This is a display-only omission, not a replacement diagnosis or correction. */
export function hierarchySafePreservation(
  action: string,
  context: string,
): string {
  if (!unsafeHierarchyAdvice(action, context)) return action;
  // Preserve a coordinated head as one clause; an amplification-only second
  // clause would otherwise lose the supplied object of "preserve".
  const coordinatedHead = action.match(
    /^(?:preserve|keep|retain|maintain)\s+and\s+(?:(?:slightly|gently|selectively|also|only)\s+)*(?:darken|sharpen|strengthen|intensify|saturate|heighten|accentuate|reinforce|emphasi[sz]e|increase|add|boost|enhance|introduce|raise)\s+[^.!?;]+/i,
  )?.[0];
  const parts = action.split(
    /[.!?;]\s*|\s+(?:and|but|while|then)\s+(?=(?:(?:slightly|gently|selectively|also|only)\s+)*(?:preserve|keep|retain|maintain|darken|sharpen|strengthen|intensify|saturate|heighten|accentuate|reinforce|emphasi[sz]e|increase|add|boost|enhance|introduce|raise)\b)/i,
  );
  if (coordinatedHead) {
    const tail = action.slice(coordinatedHead.length).split(/[.!?;]\s*/);
    parts.splice(0, parts.length, coordinatedHead, ...tail);
  }
  const safe = parts.flatMap((part) => {
    const trimmed = part.trim().replace(/[,\s]+$/, "");
    if (!/^(?:preserve|keep|retain|maintain)\s+\S/i.test(trimmed)) return [];
    // In "preserve and emphasize road curve contrast", the road curve is
    // explicitly supplied preservation. Retain that directional relationship,
    // never invent it for a contrast-only phrase with no curve/direction.
    const coordinated = trimmed.match(
      /^(preserve|keep|retain|maintain)\s+and\s+(?:(?:slightly|gently|selectively|also|only)\s+)*(?:darken|sharpen|strengthen|intensify|saturate|heighten|accentuate|reinforce|emphasi[sz]e|increase|add|boost|enhance|introduce|raise)\s+([^.!?;]+)$/i,
    );
    if (coordinated) {
      const subject = coordinated[2]
        .split(/\b(?:to|so that|because|in order to)\b/i, 1)[0]
        .match(/^.*?\b(?:curve|direction|sweep|course)\b/i)?.[0];
      return subject && /\b(?:road|street|path|lead[- ]in)\b/i.test(subject)
        ? [`${coordinated[1]} ${subject.trim()}.`]
        : [];
    }
    if (unsafeHierarchyAdvice(trimmed, context)) {
      const preservation = trimmed.split(
        /\s+(?:to|so that|in order to)\s+/i,
        1,
      )[0];
      return preservation !== trimmed &&
        !unsafeHierarchyAdvice(preservation, context)
        ? [`${preservation}.`]
        : [];
    }
    return [`${trimmed.replace(/[.!?]+$/, "")}.`];
  });
  return safe.join(" ");
}

/** A supplied road-preservation action may retain a tightly bounded near cue.
 * This exception is deliberately narrower than a general "preserve" prefix. */
export function qualifiedRoadPreservation(
  action: string,
  context: string,
): boolean {
  const parts = action
    .split(/[.!?;,]|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
  const head = parts[0] ?? "";
  // A nominal limit cannot authorize an explicitly competing focal request.
  const competing =
    /\b(?:second|new|another|competing|equal(?:ly)?|primary)\b[^.!?;]{0,45}\b(?:focal|focus)\b|\b(?:overpower\w*|outshine\w*|overshadow\w*|dominat\w*)\b|\b(?:stronger|darker|sharper|brighter|more saturated)\b[^.!?;]{0,20}\bthan\b[^.!?;]{0,30}\b(?:focal|subject|van|vehicle|boat|tower)\b/i;
  return (
    /^(?:preserve|keep|retain|maintain)\s+/i.test(head) &&
    /\b(?:road|street|path|lead[- ]in)\b/i.test(head) &&
    /\b(?:curve|direction|sweep|course)\b/i.test(head) &&
    !amplification.test(head) &&
    !competing.test(action) &&
    parts.length >= 2 &&
    // The exception applies only to the road cue followed by taper/limit
    // clauses, not unrelated corrective instructions after a preserve prefix.
    amplification.test(parts[1]) &&
    /\b(?:road|street|path|lead[- ]in)\b/i.test(parts[1]) &&
    parts
      .slice(2)
      .every(
        (part) =>
          /^(?:taper\w*|fade\w*|keep|retain|maintain|limit)\b/i.test(part) &&
          !amplification.test(part),
      ) &&
    clauses(action).some(
      (clause) =>
        amplification.test(clause) &&
        /\b(?:road|street|path|lead[- ]in)\b/i.test(clause),
    ) &&
    !unsafeHierarchyAdvice(action, context)
  );
}

const targetWords =
  /\b(?:house|church|tower|building|roof|bridge|boat|van|vehicle|car|tree|water|mountain|road|wire|pole|shadow)s?\b/gi;
function targets(action: string): Set<string> {
  const found = new Set(
    [...action.matchAll(targetWords)].map((m) =>
      /^(?:van|car|vehicle)$/i.test(m[0])
        ? "vehicle"
        : m[0].toLowerCase().replace(/s$/, ""),
    ),
  );
  // Shared surrounding water/shadow alone does not imply the same focal target.
  const objects = [...found].filter(
    (t) => !["water", "shadow", "road", "mountain", "wire", "pole"].includes(t),
  );
  return objects.length ? new Set(objects) : found;
}
function focalAmplification(i: PaintingInsight): boolean {
  return (
    amplification.test(i.action) &&
    /\b(?:focal|dominance|draw\w* (?:the )?attention|stand\w* out|centre of interest|center of interest)\b/i.test(
      `${i.lesson} ${i.action}`,
    ) &&
    !relationalRecommendation(i)
  );
}
export function sameFocalRecommendation(
  first: PaintingInsight,
  second: PaintingInsight,
): boolean {
  if (!focalAmplification(first) || !focalAmplification(second)) return false;
  const a = targets(first.action),
    b = targets(second.action);
  return [...a].some((target) => b.has(target));
}

/** A supplied integration/recession intervention, not an invented relational fact. */
export function relationalRecommendation(i: PaintingInsight): boolean {
  const text = `${i.lesson} ${i.action}`;
  return (
    /\b(?:connect\w*|integrat\w*|merge\w*|compress\w*|group\w*|quiet\w*|reduc\w*|soften\w*)\b/i.test(
      i.action,
    ) &&
    /\b(?:spatial|integration|recession|recede\w*|depth|reflection|contact shadow|surrounding|bands|background competition|supporting mass)\b/i.test(
      text,
    )
  );
}
