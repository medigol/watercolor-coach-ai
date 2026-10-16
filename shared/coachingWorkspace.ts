import {
  changeRecommendation,
  sameLearningInsight,
  temperatureConflict,
} from "./coachingEvidence.ts";
import {
  unsafeHierarchyAdvice,
  sameFocalRecommendation,
  relationalRecommendation,
} from "./coachingCalibration.ts";
import type {
  PaintingAnalysisResult,
  PaintingInsight,
} from "./paintingAnalysis.ts";
import {
  objectDesignSuggestion,
  separateStudyText,
  variableStudy,
  exerciseTeaching,
  unsupportedPlacementAdvice,
  transferablePreservation,
  purposefulFigureAdvice,
} from "./coachingLanguage.ts";

/** Presentation is derived once from the canonical classifications, not a lens. */
export function workspaceTeaching(value: PaintingAnalysisResult) {
  const c = value.canonicalAnalysis;
  const successful = c.insights
    .filter((i) => i.classification === "strength")
    .flatMap((i) => [
      i.lesson,
      ...i.factIds.flatMap((id) =>
        c.facts.filter((f) => f.id === id).map((f) => f.observation),
      ),
    ]);
  const supplied = c.insights.filter(
    (i) =>
      i.factIds.some((id) => c.facts.some((f) => f.id === id)) &&
      purposefulFigureAdvice(`${i.lesson} ${i.action}`) &&
      (i.classification === "strength" ||
        (!unsafeHierarchyAdvice(
          i.action,
          [
            i.lesson,
            ...i.factIds.flatMap((id) =>
              c.facts.filter((f) => f.id === id).map((f) => f.observation),
            ),
          ].join(" "),
        ) &&
          !temperatureConflict(
            `${i.lesson}. ${i.action}`,
            successful,
            i.factIds.flatMap((id) =>
              c.facts.filter((f) => f.id === id).map((f) => f.observation),
            ),
          ))),
  );
  const insights = supplied.map((i) =>
    unsupportedPlacementAdvice(
      `${i.lesson} ${i.action}`,
      i.factIds
        .map((id) => c.facts.find((f) => f.id === id)?.observation ?? "")
        .join(" "),
    )
      ? {
          ...i,
          classification: "stylistic_alternative" as const,
          action: separateStudyText(i.action),
        }
      : objectDesignSuggestion(i.action)
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
  const uniqueAdvice = (items: PaintingInsight[]) =>
    items.filter(
      (i, index) =>
        !items
          .slice(0, index)
          .some(
            (p) =>
              sameLearningInsight(p.lesson, i.lesson) &&
              sameLearningInsight(p.action, i.action),
          ),
    );
  const clear = uniqueAdvice(
    insights.filter((i) => i.classification === "clear_issue"),
  );
  const optional = uniqueAdvice(
    insights.filter(
      (i) =>
        i.classification === "optional_refinement" &&
        (changeRecommendation(i.action) ||
          /\b(?:compare|test|try|consider|compress|connect|group|merge|integrate|rebalance|vary|clarify|align|correct|remove|add)\b/i.test(
            i.action,
          )),
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
  const specificPriority = (i: PaintingInsight) => {
    const action = i.action;
    const located =
      /\b(?:background|foreground|middle[- ]?ground|distant|upper|lower|left|right|behind|beside|between|surrounding)\b/i.test(
        action,
      ) ||
      i.factIds.some((id) => {
        const roleId = c.facts.find((f) => f.id === id)?.roleId;
        const area = c.visualRoles.find((r) => r.id === roleId)?.area;
        return !!area && action.toLowerCase().includes(area.toLowerCase());
      });
    return located &&
      /\b(?:values?|contrast|edges?|chroma|contours?|detail|shadows?|masses|bands|spacing|temperature|shapes?|integration|soft\w*|quieter|compressed)\b/i.test(
        action,
      )
      ? 1
      : 0;
  };
  const ranked = uniqueAdvice([...clear, ...optional]).sort(
    (a, b) =>
      Number(relationalRecommendation(b)) -
        Number(relationalRecommendation(a)) ||
      specificPriority(b) - specificPriority(a) ||
      Number(b.classification === "clear_issue") -
        Number(a.classification === "clear_issue") ||
      elevationPriority(b) - elevationPriority(a),
  );
  const distinct = ranked.filter(
    (i, index) =>
      !ranked.slice(0, index).some((p) => sameFocalRecommendation(p, i)),
  );
  const recommendations = distinct
    .slice(0, ["highly_resolved", "strong"].includes(level) ? 2 : 3)
    .map((insight, index) => {
      const significant =
        (index === 0 && clear.length > 0) ||
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
  const strengths = insights
    .map((i) =>
      i.classification !== "strength"
        ? i
        : {
            ...i,
            lesson: exerciseTeaching(i.lesson)
              ? i.factIds
                  .map(
                    (id) => c.facts.find((f) => f.id === id)?.observation ?? "",
                  )
                  .filter(Boolean)
                  .join(" ")
              : i.lesson,
            action: exerciseTeaching(i.action)
              ? ""
              : transferablePreservation(i.action),
          },
    )
    .filter(
      (i) =>
        i.classification === "strength" &&
        !correctiveTeaching(i.action) &&
        !correctiveTeaching(i.lesson),
    );
  const practices = Object.values(value.expertViews)
    .map((v) => v.practice)
    .concat(
      supplied
        .filter(
          (i) => i.classification === "strength" && exerciseTeaching(i.action),
        )
        .map((i) => i.action),
    )
    .filter((p) => p && variableStudy(p))
    .filter(
      (p, index, all) =>
        !strengths.some(
          (s) => p.trim() === s.lesson.trim() || p.trim() === s.action.trim(),
        ) && !all.slice(0, index).some((a) => sameLearningInsight(a, p)),
    );
  return {
    omittedInsightIds: c.insights
      .filter((i) => !supplied.some((s) => s.id === i.id))
      .map((i) => i.id),
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
