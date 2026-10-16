// Descriptive evidence guards shared by saved-result presentation and the Edge
// cleaner. They neither inspect pixels nor reconstruct how a painting was made.
const sentences = (value: string) =>
  value.split(/(?<=[.!?])\s+|\n+/).filter(Boolean);
export function recommendedMethod(value: string): boolean {
  return /\b(?:could|might|can be practised|recommended|suggested|practi[cs]e|exercise|try|test|next study|separate study|to reproduce|to recreate)\b/i.test(
    value,
  );
}
export function unsupportedProcess(value: string): boolean {
  const history =
    /\b(?:artist|painter|you|they)\s+(?:(?:clearly|originally|effectively)\s+)?(?:used|chose|painted|mixed|glazed|layered|soaked)\b|\b(?:the|original|actual|exact) (?:brush|pigment|paper moisture|wash order|glazing sequence)\b[^.!?]{0,40}\b(?:was|is|were)\b/i;
  if (history.test(value)) return true;
  if (recommendedMethod(value)) return false;
  if (
    /\b(?:effective|confident|controlled|successful)\s+(?:use|handling|application)\s+of\s+(?:watercolou?r\s+)?(?:layering|glazing|wet blending)\b|\bcontrolled (?:glazing|layering)\b|\bareas? of wet blending\b|\b(?:glazing|layering) sequence\b/i.test(
      value,
    )
  )
    return true;
  return /\b(?:wet[- ]on[- ]wet|wet[- ]on[- ]dry|damp[- ]on[- ]damp)\b|\b(?:artist|painter|you|they)\s+(?:(?:clearly|originally|effectively)\s+)?(?:used|chose|painted|mixed|glazed|layered|soaked)\b|\b(?:was|were|must have been)\s+(?:(?:originally|fully|still|evenly)\s+)?(?:painted|applied|wetted|damp|soaked|glazed|layered)\b|\b(?:original|exact|actual)\s+(?:brush|pigment|paper moisture|wash order|glazing sequence)\b/i.test(
    value,
  );
}
export function observationText(value: unknown): string {
  if (typeof value !== "string") return "";
  return sentences(value)
    .flatMap((sentence) => {
      if (!unsupportedProcess(sentence)) return [sentence];
      // Keep an explicitly supplied visible quality; remove the inferred method.
      if (
        /\b(?:soft|diffused|crisp|sharp)\b/i.test(sentence) &&
        /\bwet[- ]on[- ](?:wet|dry)\b/i.test(sentence)
      ) {
        const visible = sentence.replace(/\bwet[- ]on[- ](?:wet|dry)\s*/gi, "");
        if (!unsupportedProcess(visible)) return [visible];
      }
      return [];
    })
    .join(" ")
    .trim();
}
export function changeRecommendation(value: string): boolean {
  if (
    /^(?:preserve|retain|keep|notice|observe)\b/i.test(value.trim()) &&
    !/\b(?:more|less|increase|reduce|sharpen|soften|enhance|deepen)\b/i.test(
      value,
    )
  )
    return false;
  return /\b(?:enhance|deepen|increase|reduce|sharpen|soften|strengthen|darken|lighten|simplify|mute|quiet|emphasize|subordinate|add (?:more )?detail)\b|\b(?:could|should|need\w*)\b[^.!?]{0,35}\b(?:crisper|sharper|softer|stronger|darker|lighter|more contrast|less detail)\b/i.test(
    value,
  );
}
const key = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b(?:distant|distance|faraway)\b/g, "background")
    .replace(
      /\b(?:recedes?|recession|depth|atmosphere|atmospheric)\b/g,
      "depth",
    )
    .replace(/\b(?:diffused|softened|softer)\b/g, "soft")
    .replace(/\b(?:restrained|muted|subdued)\b/g, "muted")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
export function sameLearningInsight(first: string, second: string): boolean {
  const a = key(first),
    b = key(second);
  if (a === b) return true;
  const tokens = (value: string) =>
    new Set(
      value
        .split(" ")
        .filter(
          (word) =>
            word.length > 3 &&
            !/^(?:painting|gives|creates|helps|clear|shows|with|that|this|from|their|there|which|into|while)$/.test(
              word,
            ),
        ),
    );
  const x = tokens(a),
    y = tokens(b);
  const common = [...x].filter((word) => y.has(word)).length;
  if (common >= 3 && common / Math.min(x.size, y.size) >= 0.7) return true;
  // Narrow synonym guard for the recurring atmospheric-depth duplication.
  return (
    [a, b].every(
      (text) => /\bbackground\b/.test(text) && /\bdepth\b/.test(text),
    ) &&
    ["soft", "muted", "cool", "contrast"].some(
      (cue) => x.has(cue) && y.has(cue),
    )
  );
}

const subjects =
  /\b(?:(upper|lower|left|right|near|far)\s+)?(house|pavilion|roof|bridge|pier|building|boat|figure|bird|tree|trees|sky|water|background|foreground|reflection|shoreline)(?:s)?\b/gi;
function areas(value: string): string[] {
  return [...value.matchAll(subjects)].map(
    (match) =>
      `${match[1] ? match[1].toLowerCase() + " " : ""}${match[2].toLowerCase().replace(/^trees$/, "tree")}`,
  );
}
function qualities(value: string): Set<string> {
  const result = new Set<string>();
  if (/\b(?:sharp|crisp|hard|defined)\b/i.test(value)) result.add("crisp edge");
  if (/\b(?:soft|diffused|lost|dissolv\w*)\b/i.test(value))
    result.add("soft edge");
  if (
    /\b(?:clear|strong|high|strongest)\b[^.!?]{0,25}\bcontrast\b/i.test(value)
  )
    result.add("high contrast");
  if (
    /\b(?:low|reduced|restrained|quiet)\b[^.!?]{0,25}\bcontrast\b/i.test(value)
  )
    result.add("low contrast");
  if (/\b(?:muted|subdued|restrained chroma|low chroma)\b/i.test(value))
    result.add("muted colour");
  if (/\b(?:saturated|high chroma|vibrant)\b/i.test(value))
    result.add("rich colour");
  if (
    /\b(?:simple|simplified|economical|few marks|selective detail)\b/i.test(
      value,
    )
  )
    result.add("simple detail");
  if (
    /\b(?:focal|dominant|centre of interest|center of interest)\b/i.test(value)
  )
    result.add("focal hierarchy");
  if (/\b(?:quiet|subordinate|supporting)\b/i.test(value))
    result.add("quiet hierarchy");
  return result;
}
export function conflictsWithStrength(
  value: string,
  strengths: readonly string[],
): boolean {
  if (
    /\b(?:separate|future|next|new) study\b/i.test(value) &&
    /\b(?:test|compare|experiment|variation|could|might|optional)\b/i.test(
      value,
    )
  )
    return false;
  for (const clause of value.split(/[.;!?]|\b(?:but|while|and)\b/i)) {
    const target = areas(clause);
    if (!target.length || !changeRecommendation(clause)) continue;
    for (const strength of strengths)
      for (const observation of strength.split(
        /[.;!?]|\b(?:but|while|and)\b/i,
      )) {
        if (!areas(observation).some((area) => target.includes(area))) continue;
        // Explicit subregions stay separate rather than assuming identical pixels.
        const a = areas(observation),
          b = areas(clause);
        if (
          a.some((area) =>
            /^(?:upper|lower|left|right|near|far) /.test(area),
          ) &&
          !a.some((area) => b.includes(area))
        )
          continue;
        const seen = qualities(observation);
        if (
          [...seen].some(
            (property) =>
              (property.endsWith("edge") &&
                /\b(?:edges?|sharpen|soften|crisper|sharper|softer)\b/i.test(
                  clause,
                )) ||
              (property.endsWith("contrast") && /\bcontrast\b/i.test(clause)) ||
              (property.endsWith("colour") &&
                /\b(?:chroma|saturat\w*|mute|muted|colour|color)\b/i.test(
                  clause,
                )) ||
              (property === "simple detail" &&
                /\b(?:detail|simplif\w*)\b/i.test(clause)) ||
              (property.endsWith("hierarchy") &&
                /\b(?:quiet|emphasiz\w*|subordinate|dominant|focal)\b/i.test(
                  clause,
                )),
          )
        )
          return true;
      }
  }
  return false;
}

/** Shared facts stay descriptive. Focus-specific interpretations are not
 * rewritten to a single goal; only unsupported/conflicting claims are omitted. */
export function evidenceFeedback<T>(value: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const result: Record<string, unknown> = {
    ...(value as Record<string, unknown>),
  };
  const strengths =
    Array.isArray(result.whatWorks) && result.whatWorks.length <= 8
      ? result.whatWorks
          .filter((item): item is string => typeof item === "string")
          .map(observationText)
          .filter(Boolean)
      : [];
  if (
    Array.isArray(result.whatWorks) &&
    result.whatWorks.length <= 8 &&
    result.whatWorks.every(
      (item) => typeof item === "string" && item.length <= 350,
    )
  )
    result.whatWorks = strengths;
  if (
    Array.isArray(result.whatToFix) &&
    result.whatToFix.length <= 8 &&
    result.whatToFix.every(
      (item) => typeof item === "string" && item.length <= 350,
    )
  )
    result.whatToFix = result.whatToFix
      .filter(
        (item) =>
          typeof item !== "string" || !conflictsWithStrength(item, strengths),
      )
      .map((item) => (typeof item === "string" ? observationText(item) : item))
      .filter((item) => item !== "");
  for (const field of [
    "mainAdvice",
    "composition",
    "values",
    "sketch",
    "promising",
    "practice",
    "paletteStrategy",
    "prompt",
  ]) {
    if (
      typeof result[field] === "string" &&
      result[field].length <=
        (["promising", "paletteStrategy"].includes(field) ? 350 : 700)
    ) {
      const safe = observationText(result[field]);
      result[field] = safe;
      if (["promising", "paletteStrategy"].includes(field) && !safe)
        delete result[field];
    }
  }
  if (
    typeof result.mainAdvice === "string" &&
    strengths.length &&
    conflictsWithStrength(result.mainAdvice, strengths)
  )
    result.mainAdvice = strengths[0];
  if (
    typeof result.practice === "string" &&
    conflictsWithStrength(result.practice, strengths)
  )
    result.practice =
      "Spend 15 minutes comparing the successful passage with a separate small study. Preserve its existing character.";
  if (
    result.coachingDecision &&
    typeof result.coachingDecision === "object" &&
    !Array.isArray(result.coachingDecision)
  ) {
    const decision = {
      ...(result.coachingDecision as Record<string, unknown>),
    };
    for (const field of [
      "primaryGoal",
      "compositionImplication",
      "colourImplication",
      "techniqueImplication",
      "currentPaintingAction",
      "nextStudyAction",
    ]) {
      if (typeof decision[field] !== "string") continue;
      const safe = observationText(decision[field]);
      decision[field] =
        safe && !conflictsWithStrength(safe, strengths) ? safe : null;
    }
    if (Array.isArray(decision.supportingObservations))
      decision.supportingObservations = decision.supportingObservations
        .filter(
          (item) => typeof item === "string" && !changeRecommendation(item),
        )
        .map(observationText)
        .filter(Boolean);
    result.coachingDecision = decision;
  }
  if (
    typeof result.promising === "string" &&
    strengths.some((item) =>
      sameLearningInsight(result.promising as string, item),
    )
  )
    delete result.promising;
  if (Array.isArray(result.overlays))
    result.overlays = result.overlays
      .slice(0, 32)
      .filter(
        (note) =>
          !note ||
          typeof note !== "object" ||
          ![note.shortInstruction, note.action].some(
            (text) =>
              typeof text === "string" &&
              conflictsWithStrength(text, strengths),
          ),
      )
      .map((note) => {
        if (!note || typeof note !== "object") return note;
        const clean = { ...note };
        for (const field of [
          "evidence",
          "shortInstruction",
          "reason",
          "action",
        ])
          if (typeof clean[field] === "string")
            clean[field] = observationText(clean[field]);
        if (
          clean.classification === "strength" &&
          [clean.shortInstruction, clean.action].some(
            (text) => typeof text === "string" && changeRecommendation(text),
          )
        ) {
          clean.classification = "study_experiment";
          clean.timing = "next_study";
        }
        return clean;
      })
      .filter(
        (note) =>
          !note ||
          typeof note !== "object" ||
          ["shortInstruction", "reason", "action"].every(
            (field) => typeof note[field] !== "string" || !!note[field].trim(),
          ),
      );
  return result as T;
}

/** Reject an explicit subject mismatch; absence of named subjects is not proof
 * of alignment and never manufactures a replacement target. */
export function studyTargetAligned(label: string, guidance: string): boolean {
  const named = areas(label),
    discussed = areas(guidance);
  return (
    !named.length ||
    !discussed.length ||
    named.some((area) => discussed.includes(area))
  );
}
