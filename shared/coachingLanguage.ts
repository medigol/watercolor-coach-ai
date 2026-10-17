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
        !/\b(?:could|should|needs? to|would benefit from)\b[^.!?]*\b(?:refin\w*|soft\w*|sharp\w*|contrast|grad\w*|quiet\w*|improv\w*|warm\w*|cool\w*)\b/i.test(
          sentence,
        ),
    )
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

/** Keep explicit single-variable exercises honest without supplying a new task. */
export function singleVariableStudyText(value: string): string {
  const families = [
    /\b(?:values?|value contrast|contrast|lightness|darkness|tonal range)\b/i,
    /\b(?:edges?|softness|sharpness|crispness|contours?)\b/i,
    /\b(?:chroma|saturation|colou?r intensity)\b/i,
    /\b(?:temperature|warmth|coolness|warmer|cooler)\b/i,
  ];
  const claim = value.match(
    /\b(?:vary(?:ing)?|chang(?:e|ing)|adjust(?:ing)?|test(?:ing)?|control(?:ling)?)\s+(?:only|just)\s+|\b(?:only|just)\s+(?:vary|change|adjust|test|control)\s+|\b(?:one|a single|single)(?: controlled)? variable\s*(?::|is|—|–|-)?\s*|\bthe only (?:controlled )?variable\s*(?::|is|—|–|-)\s*/i,
  );
  if (!claim || claim.index === undefined) return value;
  const start = claim.index + claim[0].length;
  const named = value
    .slice(start)
    .split(/[;.!?]/, 1)[0]
    .slice(0, 100);
  const first = families
    .map((family, index) => ({ index, match: family.exec(named) }))
    .filter((entry) => entry.match)
    .sort((a, b) => a.match!.index - b.match!.index)[0];
  if (!first) return value;
  const firstEnd = start + first.match!.index + first.match![0].length;
  const pieces = value.split(
    /(\s+(?:and|while(?: also)?|with|using|by|against|to)\s+|[,;]\s*|(?<=[.!?])\s+)/i,
  );
  const change =
    /\b(?:soften\w*|sharpen\w*|darken\w*|lighten\w*|increas\w*|reduc\w*|rais\w*|lower\w*|vary\w*|chang\w*|adjust\w*|mute\w*|strengthen\w*|weaken\w*|desaturat\w*|softer|sharper|crisper|harder|darker|lighter|stronger|weaker|warmer|cooler|higher|lower|more|less)\b/i;
  let offset = 0;
  let safe = "";
  for (let index = 0; index < pieces.length; index += 2) {
    const separator = index ? pieces[index - 1] : "";
    const text = pieces[index];
    const textStart = offset + separator.length;
    offset = textStart + text.length;
    const secondary = families.some(
      (family, familyIndex) => familyIndex !== first.index && family.test(text),
    );
    // A joined noun in the explicit claim is also a second variable, even
    // without another verb: "vary only value contrast and edge softness".
    const joinedClaim =
      /^\s+and\s+$/i.test(separator) &&
      !/[;.!?]/.test(value.slice(firstEnd, textStart)) &&
      !/\b(?:compare|keep|hold|leave|retain|preserve)\b/i.test(text);
    const heldConstant =
      /\b(?:same|unchanged|constant|consistent|fixed)\b/i.test(text) &&
      !/\b(?:soften\w*|sharpen\w*|darken\w*|lighten\w*|increas\w*|reduc\w*|vary\w*|chang\w*|adjust\w*)\b/i.test(
        text,
      );
    const changedComparison =
      /\b(?:versus|vs\.?|compared (?:with|to))\b/i.test(text) &&
      /\b(?:soft|sharp|crisp|hard|dark|light|warm|cool|muted|saturated)\b/i.test(
        text,
      );
    if (
      textStart >= firstEnd &&
      secondary &&
      !heldConstant &&
      (change.test(text) || changedComparison || joinedClaim)
    )
      continue;
    safe += separator + text;
  }
  safe = safe.replace(/\s+([,;.!?])/g, "$1").trim();
  if (/[.!?]$/.test(value) && !/[.!?]$/.test(safe)) safe += value.slice(-1);
  return safe;
}

export function separateStudyText(value: string): string {
  const text = singleVariableStudyText(observationText(value)).trim();
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
