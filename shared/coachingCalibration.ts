import type { PaintingInsight } from "./paintingAnalysis.ts";

// Conservative English presentation guards, not another analysis of the image.
// Only supplied advice is suppressed/ranked; no replacement diagnosis is made.
const clauses = (text: string) =>
  text
    .split(/[.!?;]|\b(?:but|while)\b/i)
    .map((c) => c.split(/\bagainst\b/i)[0]);
const amplification =
  /\b(?:darken|sharpen|strengthen|intensify|saturate|heighten|accentuate|reinforce)\b|\b(?:increase|add|boost|enhance|introduce|raise)\b[^.!?;]{0,50}\b(?:dark\w*|contrast|sharp\w*|chroma|saturation|prominence|visibility)\b|\b(?:darker|sharper|stronger|more (?:contrast|saturated))\b/i;
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
