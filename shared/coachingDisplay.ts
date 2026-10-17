import type {
  PaintingAnalysisResult,
  PaintingInsight,
} from "./paintingAnalysis.ts";
import type { ColourAnalysis } from "./colourAnalysis.ts";
import { observationText, suggestedMethodText } from "./coachingEvidence.ts";
import { supportedExplanation } from "./coachingAssessment.ts";
import { validRect } from "./imageGeometry.ts";

/** English prose only: remove an isolated foreign-script tail after English.
 * Mixed/embedded CJK is not safely repairable, so omit that optional text.
 * Unicode punctuation, accented Latin, pigment names and degrees are retained.
 * Presentation only; never used to decide whether a canonical result is valid. */
export function cleanDisplayText(text: string): string {
  let value = text
    .replace(
      /([A-Za-zÀ-ž][^\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]*?)[,;:\s]+[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]{1,8}[.!?\s]*$/u,
      "$1",
    )
    .trim();
  if (/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/u.test(value)) return "";
  return value
    .replace(/\b(visible marks)\s+is\b/gi, "$1 are")
    .replace(/\bvaried edge variation\b/gi, "edge variation")
    .replace(/\bvisible texture visible\b/gi, "visible texture")
    .replace(
      /\b(visible|soft|diffused|crisp|muted|broad|irregular)\s+\1\b/gi,
      "$1",
    )
    .replace(/[,;:]\s*$/, "")
    .trim();
}

// Identity vocabulary is deliberately smaller than an artistic interpretation.
// Only explicitly named objects are compared; no identity is read from pixels.
const identities: Record<string, RegExp> = {
  architecture:
    /\b(?:buildings?|houses?|church|tower|architecture|pavilion)\b/i,
  road: /\b(?:street|road|path)\b/i,
  pier: /\b(?:pier|jetty)\b/i,
  bridge: /\bbridge\b/i,
  sky: /\bsky\b/i,
  water: /\b(?:water|sea|lake)\b/i,
  boat: /\bboat\b/i,
  vehicle: /\b(?:van|vehicle|car)\b/i,
  mountain: /\bmountain\b/i,
  trees: /\b(?:trees?|foliage)\b/i,
};
const identityKeys = (text: string) =>
  Object.keys(identities).filter((key) => identities[key].test(text));

export function focalIdentityText(
  text: string,
  source: PaintingAnalysisResult,
): string {
  const roles = source.canonicalAnalysis.visualRoles;
  const focal = roles.find(
    (r) =>
      r.role === "focal" && (r.confidence ?? 0) >= 0.65 && validRect(r.region),
  );
  const namedArea = focal ? identityKeys(focal.area) : [];
  const linkedIdentities = focal
    ? source.canonicalAnalysis.facts
        .filter(
          (fact) =>
            fact.roleId === focal.id &&
            /\b(?:focal|stands? apart|point of attention)\b/i.test(
              fact.observation,
            ),
        )
        .map((fact) => identityKeys(fact.observation))
        .filter((keys) => keys.length === 1)
        .flat()
    : [];
  // A generic area label may have a single explicit identity in its linked
  // facts. Conflicting identities stay uncertain rather than becoming a map.
  const authority = namedArea.length
    ? namedArea
    : [...new Set(linkedIdentities)].length === 1
      ? linkedIdentities
      : [];
  // Only explicit focal-identification clauses, not relational mentions such as
  // 'the tower contrasts with water to establish focal hierarchy'.
  const claims =
    /\b(?:focal (?:area|point|subject|focus)(?:\s+(?:around|at|in|on|is))?\s+[^,;.!?]+|(?:sky|pier|water|boat|van|vehicle|mountain|bridge|house|tower|church|buildings?|street)[^,;.!?]{0,65}\b(?:forms?|is|are|creates?)\s+(?:the |a |an |clear |strong |primary |bright )*(?:focal (?:area|point|subject)|focus))\b/gi;
  const bad = (clause: string) => {
    const keys = identityKeys(
      clause.split(
        /\b(?:against|beside|while|with|supported by|contrasts? with)\b/i,
      )[0],
    );
    return (
      keys.length > 0 &&
      (!authority.length || keys.some((key) => !authority.includes(key)))
    );
  };
  return text
    .split(/(?<=[.!?])\s+/)
    .flatMap((sentence) => {
      const matches = [...sentence.matchAll(claims)];
      if (!matches.some((match) => bad(match[0]))) return [sentence];
      // Preserve an independent supplied clause, never substitute a new subject.
      return sentence
        .split(
          /;\s*|,?\s+and\s+(?=(?:a |the )?(?:clear|coherent|balanced|effective|soft|warm|cool)\b)/i,
        )
        .filter((part) => ![...part.matchAll(claims)].some((m) => bad(m[0])))
        .filter(
          (part) => part.trim() && !/^(?:with|and|but)\b/i.test(part.trim()),
        );
    })
    .join(" ")
    .trim();
}

/** Text consistency only. A formal scheme needs supplied hue relationships;
 * swatches/hex values and mere warm/cool opposition are never a theory test. */
export function colourTheoryText(text: string): string {
  const formal =
    /\b(?:near[- ]complementary|split[- ]complementary|complementary|analogous|triadic)\b/gi;
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => {
      const named = (word: string) =>
        new RegExp(`\\b${word}\\b`, "i").test(sentence);
      const deliberate =
        /\b(?:deliberate|opposing hues?|opposites? on (?:the )?colou?r wheel|colou?r[- ]wheel opposit\w*)\b/i.test(
          sentence,
        );
      const certain =
        !/\b(?:uncertain|perhaps|possibly|maybe|seems?|could|might|may)\b/i.test(
          sentence,
        );
      const complementary =
        deliberate &&
        certain &&
        ((named("red") && named("green")) ||
          (named("blue") && named("orange")) ||
          (named("yellow") && /\b(?:violet|purple)\b/i.test(sentence)));
      const analogous =
        !/\b(?:brown|red accent|warm accent|mixed|uncertain|perhaps|possibly)\w*\b/i.test(
          sentence,
        ) &&
        /\b(?:neighbou?ring|adjacent)\b/i.test(sentence) &&
        /\b(?:blue[- ]green|yellow[- ]green|red[- ]orange|blue[- ]violet|yellow[- ]orange|red[- ]violet)\b/i.test(
          sentence,
        );
      const triadic = /\b(?:three evenly spaced|equally spaced hues?)\b/i.test(
        sentence,
      );
      return sentence
        .replace(formal, (term) =>
          certain &&
          (term.toLowerCase() === "analogous"
            ? analogous
            : term.toLowerCase() === "triadic"
              ? triadic
              : complementary && !/split/i.test(term))
            ? term
            : "",
        )
        .replace(/,\s*,/g, ",")
        .replace(/\b(a|an)\s+(?=palette\b)/gi, "a ")
        .replace(/ {2,}/g, " ")
        .replace(/,\s+(?=palette\b)/gi, " ");
    })
    .join(" ")
    .trim();
}

export function displayRecreationMixes(
  mixes: ColourAnalysis["recreationMixes"],
): ColourAnalysis["recreationMixes"] {
  return mixes.flatMap((mix) => {
    if (mix.pigments.length > 2 || !mix.pigments.length) return [];
    const prose = `${mix.target} ${mix.use} ${mix.pigments.join(" ")}`;
    if (
      /\b(?:the artist used|original pigments?|exact (?:pigment|formula)|painted with)\b/i.test(
        prose,
      )
    )
      return [];
    if (
      mix.pigments.some((p) => /\b(?:white|PW\s*(?:4|6))\b/i.test(p)) &&
      !/\b(?:opaque|gouache)\b/i.test(`${mix.target} ${mix.use}`)
    )
      return [];
    const ratio =
      mix.pigments.length === 2 &&
      /^(?:1:1|2:1|3:1)$/.test(mix.startingRatio ?? "")
        ? mix.startingRatio
        : null;
    // Omit numeric precision in prose as well; do not silently invent a recipe.
    if (
      /\b\d+(?:\.\d+)?\s*(?:%|:)|\b\d+\s*(?:parts?|percent)\b/i.test(
        `${mix.target} ${mix.use}`,
      )
    )
      return [];
    const target = cleanDisplayText(mix.target),
      use = cleanDisplayText(mix.use);
    const pigments = mix.pigments.map(cleanDisplayText);
    return target && use && pigments.every(Boolean)
      ? [{ ...mix, target, use, pigments, startingRatio: ratio }]
      : [];
  });
}

/** Immutable display clone. No persistence, image access, I/O, or validation. */
export function prepareCoachingDisplay(
  source: PaintingAnalysisResult,
): PaintingAnalysisResult {
  const c = source.canonicalAnalysis;
  const observed = (text: string) =>
    colourTheoryText(
      focalIdentityText(
        cleanDisplayText(
          observationText(text)
            .replace(/\bloose technique\b/gi, "loose visible marks")
            .replace(
              /\bloose visible marks suits\b/gi,
              "loose visible marks suit",
            )
            .replace(
              /[^.!?]*\b(?:controlled technique|technique control|brush control|confident handling)\b[^.!?]*[.!?]?/gi,
              "",
            )
            .replace(/\bwash areas\b/gi, "colour areas"),
        ),
        source,
      ),
    );
  const future = (text: string) =>
    cleanDisplayText(focalIdentityText(suggestedMethodText(text), source));
  const structure = (s: typeof c.composition.primary) =>
    s
      ? {
          ...s,
          shortExplanation: observed(s.shortExplanation),
          teaching: s.teaching
            ? (Object.fromEntries(
                Object.entries(s.teaching).map(([key, value]) => [
                  key,
                  typeof value === "string"
                    ? observed(value)
                    : Array.isArray(value)
                      ? value.map(observed)
                      : value,
                ]),
              ) as typeof s.teaching)
            : s.teaching,
        }
      : s;
  const colour = c.colourAnalysis;
  return {
    ...source,
    title: observed(source.title),
    canonicalAnalysis: {
      ...c,
      qualityAssessment: {
        ...c.qualityAssessment,
        rationale: observed(c.qualityAssessment.rationale),
      },
      visualRoles: c.visualRoles.map((r) => ({ ...r, area: observed(r.area) })),
      facts: c.facts.map((f) => ({
        ...f,
        observation: observed(f.observation),
      })),
      insights: c.insights.map((i) => ({
        ...i,
        lesson: observed(i.lesson),
        action:
          i.classification === "strength"
            ? observed(i.action)
            : future(i.action),
      })),
      composition: {
        ...c.composition,
        observation: observed(c.composition.observation),
        primary: structure(c.composition.primary),
        secondary: structure(c.composition.secondary),
      },
      visualEvidence: c.visualEvidence?.map((e) => ({
        ...e,
        note: Object.fromEntries(
          Object.entries(e.note).map(([key, value]) => [
            key,
            typeof value === "string" &&
            [
              "label",
              "evidence",
              "reason",
              "shortInstruction",
              "action",
              "instruction",
              "successCheck",
            ].includes(key)
              ? [
                  "action",
                  "shortInstruction",
                  "instruction",
                  "successCheck",
                ].includes(key) &&
                c.insights.find((i) => i.id === e.insightId)?.classification !==
                  "strength"
                ? future(value)
                : observed(value)
              : value,
          ]),
        ) as typeof e.note,
      })),
      colourAnalysis: colour
        ? {
            ...colour,
            visibleColours: colour.visibleColours.map((v) => ({
              ...v,
              label: observed(v.label),
            })),
            colourStrategy: observed(colour.colourStrategy),
            valueHierarchy: observed(colour.valueHierarchy),
            chromaHierarchy: observed(colour.chromaHierarchy),
            temperatureRelationship: observed(colour.temperatureRelationship),
            technicalAssessment: colour.technicalAssessment
              ? {
                  ...colour.technicalAssessment,
                  explanation: observed(colour.technicalAssessment.explanation),
                }
              : null,
            recreationMixes: displayRecreationMixes(colour.recreationMixes),
          }
        : colour,
    },
    expertViews: Object.fromEntries(
      Object.entries(source.expertViews).map(([key, view]) => [
        key,
        { ...view, practice: future(view.practice) },
      ]),
    ) as typeof source.expertViews,
  };
}

/** Explanations must not diagnose a limitation absent from displayed teaching.
 * Facts used by alignment stay intact until all safety filters have run. */
export function finalCoachingDisplay(
  source: PaintingAnalysisResult,
  recommendations: readonly PaintingInsight[],
): PaintingAnalysisResult {
  const c = source.canonicalAnalysis;
  const text = (value: string) =>
    supportedExplanation(source, recommendations, value);
  const colour = c.colourAnalysis;
  const structure = (s: typeof c.composition.primary) =>
    s
      ? {
          ...s,
          shortExplanation: text(s.shortExplanation),
          teaching: s.teaching
            ? {
                ...s.teaching,
                risk: s.teaching.risk
                  ? text(s.teaching.risk) || null
                  : s.teaching.risk,
              }
            : s.teaching,
        }
      : s;
  return {
    ...source,
    canonicalAnalysis: {
      ...c,
      composition: {
        ...c.composition,
        observation: text(c.composition.observation),
        primary: structure(c.composition.primary),
        secondary: structure(c.composition.secondary),
      },
      facts: c.facts.map((f) => ({ ...f, observation: text(f.observation) })),
      insights: c.insights.map((i) =>
        i.classification === "strength"
          ? { ...i, lesson: text(i.lesson), action: text(i.action) }
          : i,
      ),
      colourAnalysis: colour
        ? {
            ...colour,
            colourStrategy: text(colour.colourStrategy),
            valueHierarchy: text(colour.valueHierarchy),
            chromaHierarchy: text(colour.chromaHierarchy),
            temperatureRelationship: text(colour.temperatureRelationship),
            technicalAssessment:
              colour.technicalAssessment &&
              text(colour.technicalAssessment.explanation) &&
              (!colour.technicalAssessment.insightId ||
                recommendations.some(
                  (i) => i.id === colour.technicalAssessment!.insightId,
                ) ||
                colour.technicalAssessment.kind !== "issue")
                ? {
                    ...colour.technicalAssessment,
                    explanation: text(colour.technicalAssessment.explanation),
                  }
                : null,
          }
        : colour,
    },
  };
}
