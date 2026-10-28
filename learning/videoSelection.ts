import { mediaResources, publicationErrors } from "./media";
import { itemById } from "./content";
import type { LearningProfile, LessonProgress, MediaResource } from "./types";
import type { CaptionPreferences, VideoSegment } from "./videoTypes";
export interface Demonstration {
  resource: MediaResource;
  segment: VideoSegment;
  reason: string;
  minutes: number;
  longerSession: boolean;
}
/** Reuses the current lesson; it never changes the canonical path or completion. */
export function selectDemonstrations(input: {
  lessonId: string;
  stepId: string;
  profile: LearningProfile | null;
  entry?: LessonProgress;
  captions?: CaptionPreferences;
  previousCreator?: string;
  resources?: readonly MediaResource[];
}): Demonstration[] {
  const item = itemById(input.lessonId),
    step = item?.steps.find((s) => s.id === input.stepId);
  if (!item || !step || step.id === "reflect" || step.id === "intention")
    return [];
  const p = input.profile,
    level = p?.experience ?? "beginner",
    budget = p?.minutes ?? 15;
  const candidates: (Demonstration & { rank: number[] })[] = [];
  for (const r of input.resources ?? mediaResources) {
    if (publicationErrors(r).length) continue;
    for (const s of r.segments) {
      if (
        s.lessonId !== item.id ||
        (s.stepId !== undefined && s.stepId !== step.id) ||
        !s.levels.includes(level)
      )
        continue;
      const relevant = s.skillIds.some((id) =>
        [...item.skillIds, ...item.prerequisiteSkillIds].includes(id),
      );
      if (!relevant) continue;
      const minutes = Math.ceil(s.durationSeconds / 60),
        longerSession = minutes + step.minutes > budget;
      const revisiting = input.entry?.reflection?.difficulty === "challenging";
      candidates.push({
        resource: r,
        segment: s,
        minutes,
        longerSession,
        reason: `Recommended for ${step.title.toLowerCase()}: ${s.objective}${revisiting ? " You marked this study for another attempt." : ""}${longerSession ? ` Allow a separate ${minutes}-minute viewing session before the ${step.minutes}-minute practice; drying is additional.` : ` Allow ${minutes} minutes to watch and ${step.minutes} to practise, plus drying.`}${p?.format === "reading" ? " Your written guide remains the main route; this demonstration is optional." : ""}`,
        rank: [
          s.stepId === step.id ? 1 : 0,
          s.levels.length === 1 ? 1 : 0,
          Object.values(r.review.scores!).reduce((a, b) => a + b, 0),
          longerSession ? 0 : 1,
          p &&
          (r.styleTags.includes(p.primaryStyle) ||
            r.subjectTags.includes(p.subject))
            ? 1
            : 0,
          r.creator === input.previousCreator ? 1 : 0,
          input.captions?.mode === "prefer" &&
          r.captions.languages.includes(input.captions.language)
            ? 1
            : 0,
          -s.durationSeconds,
        ],
      });
    }
  }
  candidates.sort((a, b) => {
    for (let n = 0; n < a.rank.length; n++)
      if (a.rank[n] !== b.rank[n]) return b.rank[n] - a.rank[n];
    return 0; // Stable sort preserves the curated order when all educational priorities tie.
  });
  const primary = candidates[0];
  if (!primary) return [];
  const alternative = candidates.find(
    (c) =>
      c.segment.approach !== primary.segment.approach &&
      c.segment.objective !== primary.segment.objective,
  );
  return [primary, ...(alternative ? [alternative] : [])].map(
    ({ rank, ...d }) => d,
  );
}
