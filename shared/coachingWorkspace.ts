import {
  changeRecommendation,
  sameLearningInsight,
} from "./coachingEvidence.ts";
import type {
  PaintingAnalysisResult,
  PaintingInsight,
} from "./paintingAnalysis.ts";
import {
  objectDesignSuggestion,
  separateStudyText,
  variableStudy,
} from "./coachingLanguage.ts";

/** Presentation is derived once from the canonical classifications, not a lens. */
export function workspaceTeaching(value: PaintingAnalysisResult) {
  const c = value.canonicalAnalysis;
  const supplied = c.insights.filter((i) =>
    i.factIds.some((id) => c.facts.some((f) => f.id === id)),
  );
  const insights = supplied.map((i) =>
    objectDesignSuggestion(i.action)
      ? {
          ...i,
          classification: "study_experiment" as const,
          action: separateStudyText(i.action),
        }
      : i,
  );
  const unique = (items: PaintingInsight[]) =>
    items.filter(
      (i, index) =>
        !items
          .slice(0, index)
          .some((p) => sameLearningInsight(p.lesson, i.lesson)),
    );
  const clear = unique(
    insights.filter((i) => i.classification === "clear_issue"),
  );
  const optional = unique(
    insights.filter(
      (i) =>
        i.classification === "optional_refinement" &&
        (changeRecommendation(i.action) ||
          /\b(?:compare|test|try|consider)\b/i.test(i.action)),
    ),
  );
  const level = c.qualityAssessment.level;
  const elevationPriority = (i: PaintingInsight) =>
    i.id === value.expertViews.overall.summaryId ||
    c.visualEvidence?.some(
      (e) => e.insightId === i.id && e.note.priority === "high",
    )
      ? 1
      : 0;
  const ranked = unique([
    ...clear,
    ...optional.sort((a, b) => elevationPriority(b) - elevationPriority(a)),
  ]);
  const recommendations = ranked
    .slice(0, level === "highly_resolved" ? 2 : 3)
    .map((insight, index) => {
      const significant =
        insight.classification === "clear_issue" ||
        level === "competent" ||
        level === "developing" ||
        (level === "strong" &&
          (insight.id === value.expertViews.overall.summaryId ||
            c.visualEvidence?.some(
              (e) => e.insightId === insight.id && e.note.priority === "high",
            )));
      return {
        insight,
        label: significant
          ? index === 0
            ? "Main opportunity"
            : "Secondary opportunity"
          : "Optional refinement",
      };
    });
  const opportunity = recommendations.find(
    (r) => r.label === "Main opportunity",
  )?.insight;
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
  const strengths = insights.filter(
    (i) =>
      i.classification === "strength" &&
      !correctiveTeaching(i.action) &&
      !correctiveTeaching(i.lesson),
  );
  const practices = Object.values(value.expertViews)
    .map((v) => v.practice)
    .filter((p) => p && variableStudy(p))
    .filter(
      (p, index, all) =>
        !strengths.some(
          (s) => p.trim() === s.lesson.trim() || p.trim() === s.action.trim(),
        ) && !all.slice(0, index).some((a) => sameLearningInsight(a, p)),
    );
  return {
    status,
    opportunity,
    recommendations,
    clear,
    strengths: unique(strengths)
      .slice(0, 3)
      .map((i) => {
        if (
          !/^(?:preserve|keep|retain) (?:the )?(?:central|centred|centered) placement[.!]?$/i.test(
            i.action.trim(),
          )
        )
          return i;
        const relationship = i.factIds
          .map((id) => c.facts.find((f) => f.id === id)?.observation)
          .find(
            (text) =>
              text &&
              /\b(?:value|contrast|chroma|edge|balance|separat\w*|stands? apart|hierarchy)\b/i.test(
                text,
              ),
          );
        return relationship
          ? { ...i, action: `Preserve this relationship: ${relationship}` }
          : { ...i, action: "" };
      }),
    practice: practices[0] ? separateStudyText(practices[0]) : "",
    studies: unique(
      insights.filter(
        (i) =>
          ["study_experiment", "stylistic_alternative"].includes(
            i.classification,
          ) &&
          (!objectDesignSuggestion(i.action) ||
            ["overall", "composition"].includes(i.domain)) &&
          (i.classification === "stylistic_alternative" ||
            variableStudy(i.action)),
      ),
    )
      .filter(
        (i) =>
          (!practices[0] || !sameLearningInsight(i.action, practices[0])) &&
          !recommendations.some((r) =>
            sameLearningInsight(r.insight.action, i.action),
          ),
      )
      .slice(0, 2)
      .map((i) => ({ ...i, action: separateStudyText(i.action) })),
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
