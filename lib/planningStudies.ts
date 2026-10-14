import {
  selectCompositionModels,
  type CompositionModel,
  type CompositionModelId,
} from "./compositionModels";
import {
  planThumbnailStudies,
  type ThumbnailKind,
  type ThumbnailPlanningInput,
  type ThumbnailStudy,
} from "./thumbnailPlanning";
import {
  conflictsWithDecision,
  usableCoachingDecision,
  type CoachingDecision,
} from "./coachingDecision";

export type PlanningStudiesInput = ThumbnailPlanningInput & {
  focus?: string;
  coachingDecision?: unknown;
};
export type PlanningStudy =
  | { type: "thumbnail"; source: "image" | "generic"; study: ThumbnailStudy }
  | { type: "model"; source: "generic"; model: CompositionModel };

const coveredIdeas: Record<ThumbnailKind, readonly CompositionModelId[]> = {
  crop: ["frame_in_frame"],
  eye_flow: ["s_curve", "diagonal", "lead_in"],
  big_shapes: ["big_shapes", "supporting_masses"],
  value_mass: ["connected_shadow", "big_light_dark", "big_shapes"],
  simplification: ["quiet_background", "big_shapes", "supporting_masses"],
  horizon: ["high_horizon", "low_horizon"],
  focal_point: ["off_center", "supporting_masses"],
  edge_control: ["quiet_background"],
};

function relevantModel(id: CompositionModelId, focus?: string): boolean {
  if (focus === "Colour & contrast" || focus === "Watercolor technique") {
    return [
      "connected_shadow",
      "big_light_dark",
      "quiet_background",
      "big_shapes",
    ].includes(id);
  }
  return true;
}

function alignedStudy(
  study: ThumbnailStudy,
  decision: CoachingDecision | null,
): ThumbnailStudy {
  if (!decision) return study;
  const neutral =
    "Compare this layout with your coaching goal in a separate study.";
  const action = conflictsWithDecision(study.action, decision)
    ? (decision.nextStudyAction ?? neutral)
    : study.action;
  return {
    ...study,
    purpose: conflictsWithDecision(study.purpose, decision)
      ? neutral
      : study.purpose,
    action,
    timing:
      action !== study.action ? "Test in a separate study." : study.timing,
    marks: study.marks.filter(
      (mark) =>
        ![mark.label, mark.shortInstruction, mark.reason, mark.action].some(
          (value) => conflictsWithDecision(value, decision),
        ),
    ),
  };
}

// This is a presentation choice over already saved geometry and guidance. It
// does not inspect pixels, invent image marks, or request another analysis.
export function planPlanningStudies(
  input: PlanningStudiesInput,
): PlanningStudy[] {
  const decision = usableCoachingDecision(input.coachingDecision);
  const ranked = planThumbnailStudies(input).map((study) =>
    alignedStudy(study, decision),
  );
  const backed = ranked.filter((study) => study.marks.length > 0).slice(0, 2);
  const worksheets = ranked.filter((study) => study.marks.length === 0);
  const selected = [...backed, ...worksheets.slice(0, 2 - backed.length)];
  const cards: PlanningStudy[] = selected.map((study) => ({
    type: "thumbnail",
    source: study.marks.length > 0 ? "image" : "generic",
    study,
  }));

  // A general instructor model earns a place only when saved guidance offers
  // a related design idea that is not already covered by the chosen studies.
  const hasGuidance =
    selected.some((study) => study.marks.length > 0) ||
    [input.composition, input.sketch, input.values].some(
      (value) => typeof value === "string" && !!value.trim(),
    );
  if (hasGuidance && cards.length < 3) {
    const covered = new Set(
      selected.flatMap((study) => coveredIdeas[study.kind]),
    );
    const model = selectCompositionModels(input).find(
      (candidate) =>
        !covered.has(candidate.id) &&
        relevantModel(candidate.id, input.focus) &&
        (!decision ||
          ![
            candidate.name,
            candidate.description,
            candidate.application,
            candidate.action,
          ].some((value) => conflictsWithDecision(value, decision))),
    );
    if (model) cards.push({ type: "model", source: "generic", model });
  }
  return cards.slice(0, 3);
}
