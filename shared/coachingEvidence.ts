// Descriptive evidence guards shared by saved-result presentation and the Edge
// cleaner. They neither inspect pixels nor reconstruct how a painting was made.
const sentences = (value: string) =>
  value.split(/(?<=[.!?])\s+|\n+/).filter(Boolean);
const explicitPractice =
  /^(?:on|in|for)\b[^.!?]{0,50}\bstudy\b|^on scrap\b|^(?:a|an|the)\b[^.!?]{0,45}\b(?:study|exercise) (?:could|can|might)\b|^(?:a |the )?(?:suggested|recommended)\b|^(?:try|test|practi[cs]e)\b|^to (?:reproduce|recreate)\b|^(?:a|one) practical way to (?:reproduce|recreate|practi[cs]e)\b|^this effect (?:could|can|might) be (?:practised|practiced|reproduced|recreated)\b/i;
export function recommendedMethod(value: string): boolean {
  return (
    explicitPractice.test(value) ||
    (/^(?:use|paint|compare|experiment)\b/i.test(value) &&
      /\b(?:separate|future|next|new) stud(?:y|ies)\b|\bon scrap(?: watercolou?r)? paper\b/i.test(
        value,
      ))
  );
}
export function unsupportedProcess(value: string): boolean {
  const history =
    /\b(?:artist|painter|you|they)\s+(?:(?:clearly|originally|effectively)\s+)?(?:used|chose|painted|mixed|glazed|layered|soaked|lifted)\b|\b(?:the|original|actual|exact) (?:brush|pigment|paper moisture|wash order|glazing sequence)\b[^.!?]{0,40}\b(?:was|is|were)\b|\b(?:was|were|has been|have been|must have been)\s+(?:(?:originally|fully|still|evenly)\s+)?(?:painted|applied|wetted|damp|soaked|glazed|layered|lifted)\b/i;
  if (history.test(value)) return true;
  // A modal such as “could” does not by itself make an observation a proposed
  // method. Retain methods only when explicitly framed as future practice.
  if (recommendedMethod(value)) return false;
  // These name execution methods, not visible shapes. "Negative shapes" is
  // observational; negative painting/lifting belong only to proposed practice.
  if (/\bnegative painting\b|^lifting\b|\b(?:using|through|by|via|with|preserve)\s+(?:the\s+)?lifting\b|\blifting\s+(?:paint|pigment|colou?r)\b/i.test(value)) return true;
  if (
    /\bdry[- ]?brush\b|\bwet blending\b|\bopaque (?:colou?r )?application\b|\bedge control\b|\bedge variation technique\b/i.test(
      value,
    )
  )
    return true;
  if (
    /\bsolid control of watercolou?r techniques\b|\busing layered washes\b|\b(?:more )?controlled brush\s*strokes\b|\bbroad,? loose horizontal washes\b|\b(?:loose|controlled|confident|defined|sharp(?:er)?) brushwork\b|\b(?:confident|skilful|skillful|expert) handling\b|\btechnique control\b|\bcontrolled edges\b|\b(?:strong|good|solid) control of (?:brushwork|techniques?|washes|edges)\b|\bedges? (?:are|is|were|was) (?:\w+ )?controlled\b/i.test(
      value,
    )
  )
    return true;
  if (
    /\bwash application\b|\bwashes? (?:are|is) applied\b|\b(?:some )?layering and soft blending\b|\b(?:using|applied with|painted with) (?:soft |loose |transparent )?washes\b/i.test(
      value,
    )
  )
    return true;
  if (
    /\b(?:effective|confident|controlled|successful)\s+(?:use|handling|application)\s+of\s+(?:watercolou?r\s+)?(?:layering|glazing|wet blending)\b|\bcontrolled (?:glazing|layering)\b|\bareas? of wet blending\b|\b(?:glazing|layering) sequence\b/i.test(
      value,
    )
  )
    return true;
  return /\b(?:wet[- ]on[- ]wet|wet[- ]on[- ]dry|damp[- ]on[- ]damp)\b|\b(?:artist|painter|you|they)\s+(?:(?:clearly|originally|effectively)\s+)?(?:used|chose|painted|mixed|glazed|layered|soaked|lifted)\b|\b(?:original|exact|actual)\s+(?:brush|pigment|paper moisture|wash order|glazing sequence)\b/i.test(
    value,
  );
}
function finishObservableText(
  observed: string,
  suggestedMethod: boolean,
): string {
  // A named method in an original-image description is not evidence of its
  // execution. Proposed wash/mix instructions remain methods, rather than
  // observations; keep those words without bypassing the process-history gate.
  const proposedWash =
    /^(?:mix|dilute|paint|lay|try|test|practi[cs]e)\b|^use\s+(?!of\b)|^(?:start|begin)\b[^.!?]{0,80}\b(?:parts?|ratio|mix(?:ture)?|water)\b|\b(?:approximate|suggested|starting|recreation)\b[^.!?]{0,35}\b(?:mix(?:ture)?|ratios?|pigments?)\b/i.test(
      observed,
    );
  const visible =
    suggestedMethod || proposedWash || unsupportedProcess(observed)
      ? observed
      : observed.replace(/\b(wash|washes)\b/gi, (match) => {
          const noun = /^washes$/i.test(match)
            ? "colour passages"
            : "colour passage";
          return /^[A-Z]/.test(match)
            ? noun[0].toUpperCase() + noun.slice(1)
            : noun;
        });
  // Only obvious local repetition: do not paraphrase or shorten substantive
  // teaching, change adjectives, or collapse intentional grammatical repetition.
  return visible
    .replace(
      /\b(visible|soft|diffused|crisp|sharp|dark|light|muted|warm|cool|irregular|granular|broken|broad|defined|transparent-looking)(?:[\s,]+\1\b)+/gi,
      "$1",
    )
    .replace(
      /\bvisible (texture|marks?|colou?r passages?) (is|are|was|were) visible\b/gi,
      "$1 $2 visible",
    )
    .replace(
      /\bvisible (texture|marks?|colou?r passages?) visible\b/gi,
      "visible $1",
    );
}
/** Restate only supplied visible qualities, never reconstruct a method. */
export function observableEffectText(
  value: string,
  suggestedMethod = false,
): string {
  value = value
    .replace(
      /\banatomical (inaccuracies|accuracy|errors?|structure|proportions?) (in|of|around) (the |a |this )?(van|car|vehicle|boat|building|object)\b/gi,
      (
        match,
        kind: string,
        preposition: string,
        article: string | undefined,
        object: string,
      ) =>
        `${/^[A-Z]/.test(match) ? "Drawing" : "drawing"} ${kind} ${preposition} ${article ?? ""}${object}`,
    )
    .replace(
      /\banatomy of (the |a |this )?(van|car|vehicle|boat|building|object)\b/gi,
      (match, article: string | undefined, object: string) =>
        `${/^[A-Z]/.test(match) ? "Structure" : "structure"} of ${article ?? ""}${object}`,
    );
  if (recommendedMethod(value)) return value;
  return finishObservableText(
    value
      // These labels name an inferred method. Retain only their supplied
      // visible effect; future-study methods returned above remain untouched.
      .replace(
        /\bdry[- ]?brush texture\b/gi,
        (m) =>
          `${/^[A-Z]/.test(m) ? "Irregular" : "irregular"} visible texture`,
      )
      .replace(
        /\b(?:areas? of )?wet blending\b/gi,
        (m) =>
          `${/^[A-Z]/.test(m) ? "Soft" : "soft"} blended colour transitions`,
      )
      .replace(
        /\b(soft blended colour transitions) (is|was|creates|gives|supports|produces|forms|adds|provides)\b/gi,
        (_, effect: string, verb: string) =>
          `${effect} ${/^(?:is|was)$/i.test(verb) ? (verb.toLowerCase() === "is" ? "are" : "were") : verb.slice(0, -1)}`,
      )
      // “Opaque application” alone does not establish a safely describable
      // appearance. Convert only an explicit appearance predicate. Other opaque
      // application claims remain unsupported and are omitted sentence by sentence.
      .replace(
        /\b(?:the )?opaque colou?r application (?:is|seems|appears|looks) ((?:more )?(?:dense|denser|flat|flatter|solid[- ]looking))\b/gi,
        (match, appearance: string) =>
          `${/^[A-Z]/.test(match) ? "Colour" : "colour"} passages appear ${appearance}`,
      )
      .replace(
        /\bmaintain this edge control\b/gi,
        (m) =>
          `${/^[A-Z]/.test(m) ? "Preserve" : "preserve"} this edge variation`,
      )
      .replace(/\bedge variation technique\b/gi, (m) =>
        /^[A-Z]/.test(m) ? "Edge variation" : "edge variation",
      )
      .replace(/\bedge control\b/gi, (m) =>
        /^[A-Z]/.test(m) ? "Edge variation" : "edge variation",
      )
      .replace(
        /\bbroad,? loose horizontal washes\b/gi,
        (m) =>
          `${/^[A-Z]/.test(m) ? "Broad" : "broad"} horizontal colour bands`,
      )
      .replace(
        /\b(?:the )?wash application is (controlled|loose|even) with transparent layering\b/gi,
        (_, quality: string) =>
          quality.toLowerCase() === "controlled"
            ? "Visible colour passages have transparent-looking overlaps"
            : `Visible colour passages appear ${quality.toLowerCase()}, with transparent-looking overlaps`,
      )
      .replace(
        /\b(?:watercolou?r )?washes are applied loosely with (?:some )?layering and soft blending\b/gi,
        "Visible colour passages appear loose, with overlapping colour and soft blended transitions",
      )
      .replace(
        /\b(?:some )?layering and soft blending\b/gi,
        "overlapping colour and soft blended transitions",
      )
      .replace(
        /\beffective use of soft washes(?:\s+(creates?|gives?|supports?))?/gi,
        (_, verb: string | undefined) =>
          `Soft-edged colour passages${verb ? ` ${verb.replace(/s$/i, "")}` : ""}`,
      )
      // Preservation concerns the visible effect, not a claim that the user
      // previously used a particular method. No new edge quality is supplied.
      .replace(
        /\b(?:continue|keep) (?:using|with) (soft|loose|broad) washes\b/gi,
        (_, quality: string) =>
          `Preserve ${quality.toLowerCase()} colour passages`,
      )
      .replace(
        /\b(?:continue|keep) using (?:more )?controlled brush\s*strokes\b/gi,
        "Preserve visible marks",
      )
      .replace(
        /\b(soft|loose|broad) washes\b/gi,
        (_, quality: string) => `${quality} colour passages`,
      )
      .replace(/\s+(?:using|through) layered washes\b/gi, "")
      .replace(
        /\b((?:the |a |this )?(?:boat|van|vehicle|car|building|tower|church)) (?:is|was) painted with ((?:more )?(?:defined|sharp|sharper|dark|darker)) brush\s*strokes\b/gi,
        (_, subject: string, quality: string) =>
          `${subject} has ${quality} visible marks`,
      )
      // Keep only explicit visual adjectives. “Loose” or “controlled” handling
      // does not establish crispness, darkness, mark size or brush identity.
      .replace(
        /\b(?:more )?controlled brush\s*strokes\b/gi,
        (m) => `${/^[A-Z]/.test(m) ? "Visible" : "visible"} marks`,
      )
      .replace(
        /\b(?:(?:carefully|confidently|well) )?(?:loose|controlled|confident) (?:watercolou?r )?brushwork\b/gi,
        (m) => `${/^[A-Z]/.test(m) ? "Visible" : "visible"} marks`,
      )
      .replace(
        /\b(defined|sharp|sharper|dark|darker) brush(?:work|\s*strokes)\b/gi,
        "$1 visible marks",
      )
      .replace(
        /\b(?:brushwork|brush\s*strokes)\b/gi,
        (m) => `${/^[A-Z]/.test(m) ? "Visible" : "visible"} marks`,
      )
      .replace(
        /^((?:(?:defined|sharp|sharper|dark|darker) )?visible marks) (creates|defines|separates|supports|gives|establishes)\b/i,
        (_, subject: string, verb: string) =>
          `${subject} ${verb.toLowerCase() === "establishes" ? "establish" : verb.slice(0, -1)}`,
      )
      .replace(
        /\b(edge|edges) (?:is|was|are|were) unevenly controlled\b/gi,
        (_, subject: string) =>
          `${subject} ${subject.toLowerCase() === "edge" ? "varies" : "vary"} unevenly in definition`,
      )
      .replace(
        /\b(edge|edges) (?:is|was|are|were) (?:well |carefully |evenly )?controlled\b/gi,
        (_, subject: string) =>
          `${subject} ${subject.toLowerCase() === "edge" ? "has" : "have"} consistent definition`,
      )
      .replace(
        /\b(unevenly |poorly |well[- ]|carefully |evenly )?controlled edges\b/gi,
        (match, qualifier: string | undefined) => {
          // “Poorly controlled” supplies no safe visible replacement quality.
          if (/^poorly/i.test(qualifier ?? "")) return match;
          const label = /^unevenly/i.test(qualifier ?? "")
            ? "unevenly defined edges"
            : "consistently defined edges";
          return /^[A-Z]/.test(match)
            ? label[0].toUpperCase() + label.slice(1)
            : label;
        },
      ),
    suggestedMethod,
  );
}
function cleanObservationText(
  value: unknown,
  suggestedMethod: boolean,
): string {
  if (typeof value !== "string") return "";
  return sentences(value)
    .flatMap((raw) => {
      if (/^\s*with more controlled (?:for|in)\b/i.test(raw)) return [];
      const sentence = observableEffectText(raw, suggestedMethod);
      if (!unsupportedProcess(sentence)) return [sentence];
      // Keep an explicitly supplied visible quality; remove the inferred method.
      if (
        /\b(?:soft|diffused|crisp|sharp)\b/i.test(sentence) &&
        /\bwet[- ]on[- ](?:wet|dry)\b/i.test(sentence)
      ) {
        const visible = observableEffectText(
          sentence.replace(/\bwet[- ]on[- ](?:wet|dry)\s*/gi, ""),
          suggestedMethod,
        );
        if (!unsupportedProcess(visible)) return [visible];
      }
      return [];
    })
    .join(" ")
    .trim();
}
export function observationText(value: unknown): string {
  return cleanObservationText(value, false);
}
/** Known future-method fields retain wash terminology, never inferred history. */
export function suggestedMethodText(value: unknown): string {
  return cleanObservationText(value, true);
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
  /\b(?:(upper|lower|left|right|near|far)\s+)?(house|pavilion|church|tower|street|road|mountain|van|vehicle|roof|bridge|pier|building|boat|figure|bird|tree|trees|sky|water|background|foreground|reflection|shoreline|shadow|wire|pole)(?:s)?\b/gi;
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
  observations: readonly string[] = [],
): boolean {
  if (temperatureConflict(value, strengths, observations)) return true;
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

const temperatureSubject =
  "house|church|tower|street|road|mountain|van|vehicle|boat|water|shadow|wire|pole|roof|foreground|background|light";
function temperatureTargets(
  text: string,
): { area: string; temperature: string }[] {
  const claims = new RegExp(
    `\\b(warm|cool)(?:er)?(?:[- ]toned)?\\s+((?:(?!(?:and|with|in|on|at|behind|around|of|for|to|contrasts?|warm|cool)\\b)[a-z-]+\\s+){0,3}(?:${temperatureSubject})s?)\\b|\\b((?:${temperatureSubject})s?)\\s+(?:is|are|remains?|reads?)\\s+(warm|cool)\\b`,
    "gi",
  );
  return [...text.matchAll(claims)].map((m) => {
    const phrase = m[2] ?? m[3];
    const nouns = [
      ...phrase.matchAll(new RegExp(`\\b(?:${temperatureSubject})s?\\b`, "gi")),
    ];
    const location = phrase.match(
      /\b(?:upper|lower|left|right|near|far)\b/i,
    )?.[0];
    return {
      area: `${location ? location.toLowerCase() + " " : ""}${nouns.at(-1)![0].toLowerCase().replace(/s$/, "")}`,
      temperature: (m[1] ?? m[4]).toLowerCase(),
    };
  });
}
/** Opposite-temperature advice needs local evidence, not generic palette unity.
 * An arbitrary separate-study prefix is not evidence of reflected warmth. */
export function temperatureConflict(
  value: string,
  strengths: readonly string[],
  observations: readonly string[] = [],
): boolean {
  const supportedReflection =
    /\b(?:separate|future|next|small) study\b/i.test(value) &&
    /\b(?:compare|test|experiment)\b/i.test(value) &&
    /\breflected (?:warmth|warm light)\b/i.test(value) &&
    /\b(?:upper|lower|left|right|underside|base|small|selected)\b/i.test(
      value,
    ) &&
    /\b(?:keep\w*|retain\w*|preserv\w*)\b[^.!?]{0,70}\bcool\b/i.test(value) &&
    observations.some(
      (o) =>
        /\breflected (?:warmth|warm light)\b/i.test(o) &&
        areas(o).some((a) =>
          areas(value).some(
            (b) =>
              a.replace(/^(?:upper|lower|left|right|near|far) /, "") ===
              b.replace(/^(?:upper|lower|left|right|near|far) /, ""),
          ),
        ),
    );
  if (supportedReflection) return false;
  for (const clause of clausesForTemperature(value)) {
    // Express a proposed temperature change as an adjective solely to match
    // it to a supplied successful property. Nothing is rewritten for display.
    const proposed = clause
      .replace(/\b(?:warm|cool)\s+(?:the|these|those)\s+/gi, (m) =>
        m.replace(/\s+(?:the|these|those)\s+/i, " "),
      )
      .replace(
        /\bmake\s+(?:the\s+)?([^.!?]{1,65})\s+(warmer|cooler)\b/gi,
        (_, target: string, temp: string) =>
          `${temp.replace(/er$/, "")} ${target}`,
      )
      .replace(
        /\b(?:increase|add)\s+warmth\s+(?:to|in)\s+(?:the\s+)?/gi,
        "warm ",
      )
      .replace(
        /\b(?:increase|add)\s+coolness\s+(?:to|in)\s+(?:the\s+)?/gi,
        "cool ",
      );
    if (
      !/\b(?:warm|cool)\s+(?:the|these|those)\b|\b(?:warmer|cooler|increase warmth|add warmth|increase coolness|add coolness)\b|^\s*(?:warm|cool)\b|\b(?:should|could|try to)\s+(?:warm|cool)\b/i.test(
        clause,
      )
    )
      continue;
    for (const change of temperatureTargets(proposed))
      for (const strength of strengths)
        for (const seen of temperatureTargets(strength)) {
          const a = change.area.replace(
              /^(?:upper|lower|left|right|near|far) /,
              "",
            ),
            b = seen.area.replace(/^(?:upper|lower|left|right|near|far) /, "");
          if (a !== b || change.temperature === seen.temperature) continue;
          if (change.area !== a && seen.area !== b && change.area !== seen.area)
            continue;
          return true;
        }
  }
  return false;
}
const clausesForTemperature = (value: string) =>
  value.split(/[.;!?]|\b(?:but|while|and)\b/i);

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
      .map((item) =>
        typeof item === "string" ? suggestedMethodText(item) : item,
      )
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
      const safe =
        field === "practice"
          ? suggestedMethodText(result[field])
          : observationText(result[field]);
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
      const safe = ["currentPaintingAction", "nextStudyAction"].includes(field)
        ? suggestedMethodText(decision[field])
        : observationText(decision[field]);
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
            clean[field] =
              clean.classification !== "strength" &&
              ["shortInstruction", "action"].includes(field)
                ? suggestedMethodText(clean[field])
                : observationText(clean[field]);
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
