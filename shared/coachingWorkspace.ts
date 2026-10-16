import {
  changeRecommendation,
  sameLearningInsight,
} from "./coachingEvidence.ts";
import type {
  PaintingAnalysisResult,
  PaintingInsight,
} from "./paintingAnalysis.ts";

/** Presentation is derived once from the canonical classifications, not a lens. */
export function workspaceTeaching(value: PaintingAnalysisResult) {
  const c = value.canonicalAnalysis;
  const clear = c.insights.filter((i) => i.classification === "clear_issue");
  const optional = c.insights.filter(
    (i) =>
      i.classification === "optional_refinement" &&
      (changeRecommendation(i.action) ||
        /\b(?:compare|test|try|consider)\b/i.test(i.action)),
  );
  const level = c.qualityAssessment.level;
  const opportunity =
    clear[0] ??
    (level === "competent" || level === "developing" ? optional[0] : undefined);
  const status = clear.length
    ? level === "developing"
      ? "Main priority"
      : "Main opportunity"
    : level === "highly_resolved"
      ? "No significant correction is needed."
      : level === "strong"
        ? "No major issue detected. Explore optional refinements or studies."
        : opportunity
          ? "Main opportunity to explore"
          : "Review the observed structure and handling below.";
  const strengths = c.insights.filter(
    (i) =>
      i.classification === "strength" &&
      !correctiveTeaching(i.action) &&
      !correctiveTeaching(i.lesson),
  );
  const unique = (items: PaintingInsight[]) =>
    items.filter(
      (i, index) =>
        !items
          .slice(0, index)
          .some((p) => sameLearningInsight(p.lesson, i.lesson)),
    );
  const practices = Object.values(value.expertViews)
    .map((v) => v.practice)
    .filter(Boolean)
    .filter(
      (p, index, all) =>
        !strengths.some(
          (s) =>
            sameLearningInsight(p, s.lesson) ||
            sameLearningInsight(p, s.action),
        ) && !all.slice(0, index).some((a) => sameLearningInsight(a, p)),
    );
  return {
    status,
    opportunity,
    clear,
    strengths: unique(strengths).slice(0, 3),
    practice: practices[0] ?? "",
    studies: unique(
      c.insights.filter((i) =>
        ["study_experiment", "stylistic_alternative"].includes(
          i.classification,
        ),
      ),
    )
      .filter(
        (i) => !practices[0] || !sameLearningInsight(i.action, practices[0]),
      )
      .slice(0, 2),
  };
}
export function correctiveTeaching(value: string): boolean {
  return (
    changeRecommendation(value) &&
    /(?:^|[.!?;:]\s*|\band\s+)(?:enhance|deepen|increase|reduce|sharpen|soften|strengthen|darken|lighten|simplify|mute|quiet|add)\b|\b(?:should|needs? to|could)\b/i.test(
      value,
    )
  );
}
