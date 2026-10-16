import { observationText } from "./coachingEvidence.ts";

/** Display safeguards use supplied words, never new observations or geometry. */
export function qualityRationaleText(value: string): string {
  const cleaned = observationText(value)
    .replace(
      /[,;]?\s+\b(?:though|although|but|however|yet)\b[^.!?]*\b(?:could|might|may|refin\w*|would benefit)\b[^.!?]*[.!?]?/gi,
      ".",
    )
    .replace(
      /[,;]?\s+\b(?:though|although|but|however)\b[^.!?]*\b(?:inaccurac\w*|errors?|weakens?|limits?|disrupt\w*)\b[^.!?]*[.!?]?/gi,
      ".",
    )
    .split(/(?<=[.!?])\s+/)
    .filter(
      (sentence) =>
        !/^(?:(?:minor|optional|further) refinements?\b|(?:some|a few) (?:edges|areas|passages)\b)[^.!?]*\b(?:could|might|may|would benefit)\b/i.test(
          sentence,
        ),
    )
    .filter(
      (sentence, index) =>
        index === 0 ||
        !/\b(?:perspective|proportion|drawing)\b[^.!?]*\b(?:inaccurac\w*|errors?|limits?|weakens?)\b/i.test(
          sentence,
        ),
    )
    .join(" ")
    .trim();
  const sentences =
    cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()) ?? [];
  const complete = sentences.filter((s) => /[.!?]$/.test(s));
  // A supplied complete sentence is preferable to an unfinished extra clause.
  if (complete.length) return complete.slice(0, 2).join(" ");
  return /\b(?:and|or|a|an|the|with|of|for|to)\s*$/i.test(cleaned)
    ? ""
    : cleaned;
}

export function transferablePreservation(value: string): string {
  if (!/^(?:preserve|keep|retain|maintain)\b/i.test(value)) return value;
  return value
    .replace(
      /\s+and\s+(?:(?:its|the|their)\s+)?(?:central|centred|centered) placement(?=[,.!?]|$)/gi,
      "",
    )
    .replace(/\b(?:central|centred|centered) placement\s+and\s+/gi, "");
}

export function purposefulFigureAdvice(value: string): boolean {
  if (
    !/\b(?:add|place|introduce|insert)\b[^.!?]{0,65}\b(?:figures?|people|person)\b/i.test(
      value,
    )
  )
    return true;
  return /\b(?:human scale|scale|spatial transition|visual (?:flow|step)|rhythm|balance|narrative|hierarchy|lead\w* toward|subordinate)\b/i.test(
    value,
  );
}

export function separateStudyText(value: string): string {
  const text = observationText(value).trim();
  if (!text) return "";
  let safe = text.replace(
    /\b(?:your|the) (?:current |finished |existing )?painting\b/gi,
    "the study",
  );
  const framing =
    /\b(?:on|in|for) (?:a |the )?(?:(?:separate|small|new|future|next|\d+[–-]?\d*[- ]minute) ){0,3}(?:study|studies)\b|\bon scrap(?: watercolou?r)?(?: paper)?\b/gi;
  let hasFrame = false;
  safe = safe
    .replace(framing, (match, offset: number) => {
      if (!hasFrame && offset === 0) {
        hasFrame = true;
        return match;
      }
      return "";
    })
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s*[,;]\s*/, "")
    .trim();
  if (!safe) return "";
  if (
    /^(?:on|in|for)\b[^.!?]{0,65}\b(?:scrap|separate|study|studies)\b/i.test(
      safe,
    )
  )
    return safe;
  return `On a separate small study, ${safe[0].toLowerCase()}${safe.slice(1)}`;
}

export const exerciseTeaching = (value: string): boolean =>
  /\b(?:on scrap(?: watercolou?r)?(?: paper)?|(?:on|in) a (?:separate |small |\d+[- ]minute )*study|paint (?:a |two |three )?(?:study|studies|versions?|thumbnails?)|practi[cs]e|exercise)\b/i.test(
    value,
  ) || /^(?:try|test|compare|paint|use)\b/i.test(value.trim());

/** Position alone is taste. Only explicitly supplied visual harm supports correction. */
export function unsupportedPlacementAdvice(
  value: string,
  observations: string,
): boolean {
  const positional =
    /\b(?:off[- ]cent(?:re|er)|cent(?:ral|red|ered|re|er) (?:placement|position)|move\b[^.!?]{0,45}\b(?:left|right|side|thirds))\b/i.test(
      value,
    );
  const positionalEvidence =
    /\b(?:cent(?:ral|red|ered|re|er)|placement|position|overlap\w*|crowd\w*|tangen\w*|blocks?|cuts? off|collid\w*|equal (?:masses|spaces|gaps|weight)|symmetr\w*)\b/i.test(
      observations,
    );
  const harm =
    positionalEvidence &&
    /\b(?:obscur\w*|unreadable|confus\w*|blocks?|cuts? off|competes?|collid\w*|weakens?|flattens?|disrupts?|harms?)\b/i.test(
      observations,
    );
  return (
    positional &&
    /\b(?:move|relocat\w*|shift|off[- ]cent(?:re|er)|risks?|static|weakens?|improve)\b/i.test(
      value,
    ) &&
    !harm
  );
}

/** A repeatable experiment needs a supplied change and something to compare. */
export function variableStudy(value: string): boolean {
  return (
    /\b(?:compare|versus|vs\.?|against|which|difference|alternate|two versions)\b/i.test(
      value,
    ) &&
    /\b(?:vary|change|versions?|alternate|with|without|softer|sharper|quieter|lower|higher|narrower|compress\w*|reduce\w*|increase\w*|two|three)\b/i.test(
      value,
    ) &&
    /\b(?:values?|contrast|edges?|chroma|warm|cool|detail|shapes?|crop|shadow|wash|figures?|light|spacing|soft|crisp|foreground|background)\b/i.test(
      value,
    )
  );
}

export function objectDesignSuggestion(value: string): boolean {
  return (
    /\b(?:add|place|introduce|insert|move|relocate|remove|omit)\b[^.!?]{0,65}\b(?:figures?|people|person|boats?|objects?|vehicles?)\b/i.test(
      value,
    ) ||
    /\b(?:compare|test)\b[^.!?]{0,80}\b(?:figures?|people|person|boats?|objects?|vehicles?)\b[^.!?]{0,65}\b(?:with no (?:figures?|people|person|boats?|objects?|vehicles?)|without (?:them|figures?|people|boats?|objects?|vehicles?)|versus none|vs\.? none)\b/i.test(
      value,
    )
  );
}

/** Percentage-like precision is unsupported. Keep simple recreation ratios. */
export function approximateMixRatio(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value
    .trim()
    .match(
      /^(?:(?:roughly|about|approximately)\s+)?([1-4])\s*:\s*([1-4])(?:\s*:\s*([1-4]))?$/i,
    );
  return match ? match.slice(1).filter(Boolean).join(":") : null;
}

function hue(hex: string): number | null {
  if (!/^#[a-f0-9]{6}$/i.test(hex)) return null;
  const [r, g, b] = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min;
  if (delta < 0.12 || !max || delta / max < 0.2) return null;
  const h =
    max === r
      ? (g - b) / delta
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;
  return (h * 60 + 360) % 360;
}

export function colourRelationshipText(
  value: string,
  colours: string[] = [],
): string {
  if (!/\b(?:near[- ]?)?complementary\b/i.test(value)) return value;
  const namedPair = [
    [/\bred\b/i, /\bgreen\b/i],
    [/\bblue\b/i, /\borange\b/i],
    [/\byellow\b/i, /\b(?:violet|purple)\b/i],
  ].some(([a, b]) => a.test(value) && b.test(value));
  const hues = colours.map(hue).filter((v): v is number => v !== null);
  const supported =
    namedPair ||
    hues.some((a, i) =>
      hues.slice(i + 1).some((b) => {
        const difference = Math.abs(a - b);
        return Math.min(difference, 360 - difference) >= 150;
      }),
    );
  if (supported) return value;
  return value
    .replace(
      /\b(?:near[- ]?)?complementary\s+warm\s*(?:and|\/|–|-)\s*cool\s+colou?rs?\b/gi,
      "warm–cool contrast",
    )
    .replace(/\b(?:near[- ]?)?complementary\b/gi, "contrasting");
}
