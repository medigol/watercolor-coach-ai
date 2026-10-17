import type {
  PaintingAnalysisResult,
  PaintingInsight,
} from "./paintingAnalysis.ts";
import {
  evidencedProblem,
  evidenceProperties,
  evidenceTargets,
  insightAlignment,
  materialInsight,
} from "./coachingAlignment.ts";
import { observationText } from "./coachingEvidence.ts";

// Display-only calibration over supplied text, not a new assessment of pixels.
// A missing/suppressed recommendation never by itself establishes strong work.
const positive =
  /\b(?:clear|coherent|balanced|successful|effective|convincing|resolved|strong|well[- ]organised|well[- ]organized|stands? apart|readable)\b/i;
const negatedPositive =
  /\b(?:not|never|without)\s+(?:(?:yet|fully|entirely|consistently|particularly)\s+)?(?:clear|coherent|balanced|successful|effective|convincing|resolved|strong|readable)\b/i;
const successfulPositive = (text: string) =>
  positive.test(text) && !negatedPositive.test(text);
const limitation =
  /\b(?:need\w*|requires?|would benefit|could benefit|could improve|could be improved|could be refined|refinements?|corrections?|weak\w*|poor\w*|inaccurac\w*|errors?|inconsisten\w*|distort\w*|insufficient|lacks?|muddy|disconnect\w*|detach\w*|flatten\w*|unresolved|compressed|limiting|limits?|competes?|competition|competing|excess\w*|unclear (?:hierarchy|separation|depth)|(?:perspective|proportion|drawing) problems?|too (?:uniform|sharp|dark|light|saturated|strong|many)|overly)\b|\b(?:could|should|might|may|would)\b[^.!?]{0,50}\b(?:softer|sharper|quieter|stronger|warmer|cooler|refin\w*|improv\w*|adjust\w*|clarif\w*|correct\w*)\b/i;
const uncertainty =
  /\b(?:uncertain|unclear|perhaps|possibly|seems?|appears? to|difficult to|hard to|cannot|can't|inconclusive|may|might|could)\b/i;
const personJudgement =
  /\b(?:artist|painter|you|they)\b[^.!?]{0,45}\b(?:skill\w*|experienced|expert|talented|professional)\b|\b(?:confident handling|technique control|skillful|skilful)\b/i;
// The shared property families are deliberately broad. A rationale explicitly
// naming perspective cannot be justified by a recommendation about proportion;
// likewise a chroma adjustment does not establish a temperature limitation.
const preciseProperties = [
  /\bperspective\b/i,
  /\bdrawing\b/i,
  /\bproportions?\b/i,
  /\balignment\b/i,
  /\b(?:temperature|warm\w*|cool\w*)\b/i,
  /\b(?:chroma|saturat\w*)\b/i,
];
export function hasLimitation(text: string): boolean {
  const checked = text
    // A supplied absence of competition is successful hierarchy, not critique.
    .replace(
      /\b(?:without|not)\s+(?:(?:becoming|creating|being)\s+)?(?:a\s+)?competing\b/gi,
      "",
    )
    .replace(
      /\bno (?:significant |major |material )?correction (?:is )?needed\b|\b(?:does|do) not need (?:significant |major |material )?(?:correction|refinement)\b/gi,
      "",
    )
    .split(/[.!?;]/)
    .map((clause) => {
      // Compressed values can successfully create recession. Exempt only that
      // supplied positive relationship; compressed space/shadows or any other
      // named harm remain limitations. This changes no displayed source text.
      const valueCompression = clause.replace(
        /\bcompressed\s+(?:(?:background|distant|mountain|supporting)\s+)?(?:values?|value range|tonal range)\b/gi,
        (match) => match.replace(/\bcompressed\b/i, ""),
      );
      const positiveEffect =
        /\b(?:support\w*|creat\w*|establish\w*|preserv\w*|maintain\w*|strengthen\w*)\b[^;.!?]{0,65}\b(?:depth|recession|atmospher\w*|focal separation|hierarchy)\b/i.test(
          clause,
        );
      return valueCompression !== clause &&
        positiveEffect &&
        !/\b(?:not|never|without|cannot|can't)\b/i.test(clause) &&
        !uncertainty.test(clause) &&
        !negatedPositive.test(clause) &&
        !limitation.test(valueCompression) &&
        !evidencedProblem(valueCompression)
        ? valueCompression
        : clause;
    })
    .join(".");
  return limitation.test(checked);
}

function rationaleClauses(sentence: string): string[] {
  const contrast = sentence.split(
    /[,;]?\s+\b(?:though|although|but|however|yet)\b\s*/i,
  );
  return contrast.flatMap((clause) => {
    const consequence = clause.split(
      /,\s*(?=(?:limiting|weakening|flattening|obscuring|reducing depth)\b)/i,
    );
    if (consequence.length > 1) return consequence;
    // Keep a supplied positive explanation when an appended clause introduces
    // a different limitation. Never retain a bare property as a new sentence.
    for (const match of clause.matchAll(/[,;]\s*|\s+and\s+/gi)) {
      const before = clause.slice(0, match.index).trim();
      const after = clause.slice(match.index! + match[0].length).trim();
      if (
        positive.test(before) &&
        !hasLimitation(before) &&
        hasLimitation(after)
      )
        return [before, after];
    }
    return [clause];
  });
}

/** Preserve only supplied assessment language supported by displayed teaching. */
export function assessCoaching(
  source: PaintingAnalysisResult,
  survivingRecommendations: readonly PaintingInsight[],
  finalSafeIssues?: readonly PaintingInsight[],
): PaintingAnalysisResult["canonicalAnalysis"]["qualityAssessment"] {
  const c = source.canonicalAnalysis;
  const original = c.qualityAssessment;
  const suppliedRationale = observationText(original.rationale).trim();
  const actionable = survivingRecommendations.filter(
    (i) =>
      ["clear_issue", "optional_refinement"].includes(i.classification) &&
      i.action.trim() &&
      c.insights.some((s) => s.id === i.id) &&
      i.factIds.some((id) => c.facts.some((f) => f.id === id)) &&
      insightAlignment(i, c.facts) === "supported",
  );
  const supportsLimitation = (clause: string) => {
    const named = evidenceProperties(clause);
    const targets = evidenceTargets(clause);
    const supportedBy = (match: (text: string) => boolean) =>
      actionable.some(
        (i) =>
          match(`${i.lesson} ${i.action}`) &&
          c.facts.some(
            (f) =>
              i.factIds.includes(f.id) &&
              evidencedProblem(f.observation) &&
              (!targets.length ||
                targets.some((t) =>
                  evidenceTargets(f.observation).includes(t),
                )) &&
              match(f.observation),
          ),
      );
    return (
      named.length > 0 &&
      named.every((property) =>
        supportedBy((text) => evidenceProperties(text).includes(property)),
      ) &&
      preciseProperties
        .filter((property) => property.test(clause))
        .every((property) => supportedBy((text) => property.test(text)))
    );
  };
  const sentences = suppliedRationale.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];
  const rationale = sentences
    .flatMap(rationaleClauses)
    .map((clause) => clause.trim().replace(/^[,;:.\s]+|[,;:\s]+$/g, ""))
    .filter(
      (clause) =>
        clause &&
        !personJudgement.test(clause) &&
        !/\b(?:and|or|a|an|the|with|of|for|to)\s*$/i.test(clause) &&
        (!hasLimitation(clause) || supportsLimitation(clause)),
    )
    .slice(0, 4)
    .map((clause) => (/[.!?]$/.test(clause) ? clause : `${clause}.`))
    .join(" ");

  const suppliedSuccessfulFact = c.insights.some(
    (i) =>
      i.classification === "strength" &&
      !hasLimitation(i.lesson) &&
      !uncertainty.test(i.lesson) &&
      !negatedPositive.test(i.lesson) &&
      i.factIds.some((id) =>
        c.facts.some((f) => {
          const lessonProperties = evidenceProperties(i.lesson);
          const factProperties = evidenceProperties(f.observation);
          const lessonTargets = evidenceTargets(i.lesson);
          const factTargets = evidenceTargets(f.observation);
          const sharedProperty = lessonProperties.some((property) =>
            factProperties.includes(property),
          );
          return (
            f.id === id &&
            f.observation.trim() &&
            !evidencedProblem(f.observation) &&
            !hasLimitation(f.observation) &&
            !uncertainty.test(f.observation) &&
            !negatedPositive.test(f.observation) &&
            (!lessonProperties.length ||
              !factProperties.length ||
              sharedProperty) &&
            (!lessonTargets.length ||
              !factTargets.length ||
              lessonTargets.some((target) => factTargets.includes(target))) &&
            (successfulPositive(f.observation) ||
              (successfulPositive(i.lesson) && sharedProperty))
          );
        }),
      ),
  );
  // Direct audits remain conservative about unpresented supported issues.
  // Workspace callers explicitly supply the final safe state after filtering;
  // a suppressed raw label then cannot remain a hidden quality blocker.
  // A card budget alone must not erase a real, safely supported limitation.
  const material = (finalSafeIssues ?? actionable).some(
    (i) =>
      ["clear_issue", "optional_refinement"].includes(i.classification) &&
      materialInsight(i, c.facts),
  );
  // A label alone cannot establish a limitation. In final display mode only
  // surviving, evidence-aligned material issues can block normalization.
  const unresolvedIssue = (finalSafeIssues ?? c.insights).some(
    (i) => i.classification === "clear_issue" && materialInsight(i, c.facts),
  );
  const normalizeStrong =
    ["competent", "developing"].includes(original.level) &&
    original.confidence >= 0.8 &&
    !!rationale &&
    successfulPositive(rationale) &&
    !hasLimitation(finalSafeIssues ? rationale : original.rationale) &&
    !uncertainty.test(finalSafeIssues ? rationale : original.rationale) &&
    !personJudgement.test(original.rationale) &&
    (!finalSafeIssues ||
      c.colourAnalysis?.technicalAssessment?.kind !== "uncertain") &&
    suppliedSuccessfulFact &&
    !material &&
    !unresolvedIssue;
  return {
    level: normalizeStrong ? "strong" : original.level,
    confidence: original.confidence,
    rationale,
  };
}

/** Use the same supplied-fact test for explanatory sections as for rationale.
 * This is a display projection, never a canonical validation/repair pass. */
export function supportedExplanation(
  source: PaintingAnalysisResult,
  recommendations: readonly PaintingInsight[],
  text: string,
): string {
  const c = source.canonicalAnalysis;
  return assessCoaching(
    {
      ...source,
      canonicalAnalysis: {
        ...c,
        qualityAssessment: { ...c.qualityAssessment, rationale: text },
      },
    },
    recommendations,
  ).rationale.replace(
    /[.!?]\s+(preserving|supporting|maintaining)\b/gi,
    ", $1",
  );
}
