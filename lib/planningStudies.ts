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
import {
  drawableCompositionOverlay,
  type CompositionOverlay,
} from "../shared/visualMetadata";
import {
  legacyGeometry,
  noteAnchors,
  noteGeometryVisible,
  noteRegions,
  type NormalizedPoint,
  type NormalizedRect,
} from "./imageGeometry";
import { overlayKind, usableOverlays, type CoachingOverlay } from "./overlays";
import { imageStudyMarks } from "./thumbnailPlanning";

export type PlanningStudiesInput = ThumbnailPlanningInput & {
  focus?: string;
  coachingDecision?: unknown;
  currentCompositionOverlay?: unknown;
  secondaryCompositionOverlay?: unknown;
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

const currentModel: Partial<
  Record<CompositionOverlay["type"], CompositionModelId[]>
> = {
  diagonal: ["diagonal"],
  s_curve: ["s_curve"],
  l_shape: ["l_foreground"],
  u_frame: ["frame_in_frame"],
  enclosure: ["frame_in_frame"],
  triangle: ["triangle"],
  rule_of_thirds: ["off_center"],
  off_centre: ["off_center"],
};

const samePoint = (a: NormalizedPoint, b: NormalizedPoint) =>
  Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9;
const samePath = (a: NormalizedPoint[], b: NormalizedPoint[]) =>
  a.length === b.length &&
  a.every((point, index) => samePoint(point, b[index]));

function samePolygon(a: NormalizedPoint[], b: NormalizedPoint[]): boolean {
  const open = (points: NormalizedPoint[]) =>
    points.length > 1 && samePoint(points[0], points[points.length - 1])
      ? points.slice(0, -1)
      : points;
  const first = open(a),
    second = open(b);
  return (
    first.length >= 3 &&
    first.length === second.length &&
    second.some(
      (_, start) =>
        first.every((point, index) =>
          samePoint(point, second[(start + index) % second.length]),
        ) ||
        first.every((point, index) =>
          samePoint(
            point,
            second[(start - index + second.length) % second.length],
          ),
        ),
    )
  );
}

// Compare only supplied, normalized geometry. Similar subjects, nearby points,
// or archetype names alone never erase a genuine future-study experiment.
function repeatsCurrentGeometry(
  note: CoachingOverlay,
  current: CompositionOverlay,
): boolean {
  if (!noteGeometryVisible(note)) return false;
  const sameRegion = ({ x, y, width, height }: NormalizedRect) => {
    const corners = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
    return (
      (current.paths ?? []).some((path) => samePolygon(corners, path)) ||
      (current.masses ?? []).some((mass) => samePolygon(corners, mass.points))
    );
  };
  const regions = noteRegions(note);
  const targets = [
    ...(current.focalPoint ? [current.focalPoint] : []),
    ...(current.secondaryPoints ?? []),
    ...(current.paths ?? []).flat(),
  ];
  if (note.scope === "multi_region") {
    // A relationship is a duplicate only when every supplied target is already
    // represented; one shared region must not erase a genuinely new comparison.
    const anchors = note.anchors ?? [];
    return (
      (regions.length > 0 || anchors.length > 0) &&
      regions.every(sameRegion) &&
      anchors.every((anchor) =>
        targets.some((point) => samePoint(anchor, point)),
      )
    );
  }
  const geometry = legacyGeometry(note);
  if (!geometry) return false;
  // A future crop's saved frame is the experiment. Its context region may still
  // describe the current composition, so do not confuse that shared context
  // with an identical crop.
  if (overlayKind(note) === "crop_box")
    return !!geometry.rect && sameRegion(geometry.rect);
  if (overlayKind(note) === "focal_ring") {
    const focal = current.focalPoint;
    return (
      !!focal && noteAnchors(note).some((anchor) => samePoint(anchor, focal))
    );
  }
  if (geometry.points.length) {
    return (
      (current.paths ?? []).some((path) => samePath(geometry.points, path)) ||
      (current.masses ?? []).some((mass) =>
        samePolygon(geometry.points, mass.points),
      )
    );
  }
  return regions.length > 0 && regions.every(sameRegion);
}

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
  const primary =
    input.provider === "openai" && input.uri?.trim()
      ? drawableCompositionOverlay(input.currentCompositionOverlay)
      : null;
  const secondary = primary
    ? drawableCompositionOverlay(input.secondaryCompositionOverlay)
    : null;
  const identity = (structure: CompositionOverlay) =>
    JSON.stringify({ ...structure, shortExplanation: "", confidence: 0 });
  const current = primary
    ? [
        primary,
        ...(secondary && identity(secondary) !== identity(primary)
          ? [secondary]
          : []),
      ]
    : [];
  const notes = current.length ? usableOverlays(input.overlays) : [];
  const repeated = current.length
    ? notes.filter((note) =>
        current.some((structure) => repeatsCurrentGeometry(note, structure)),
      )
    : [];
  const repeatedKinds = new Set(
    current.length
      ? (Object.keys(coveredIdeas) as ThumbnailKind[]).filter(
          (kind) => imageStudyMarks(kind, repeated).length > 0,
        )
      : [],
  );
  // Re-rank after removing exact duplicates so a lower-ranked alternate crop or
  // eye path can still earn a place. Saved data itself is never rewritten.
  const available = current.length
    ? { ...input, overlays: notes.filter((note) => !repeated.includes(note)) }
    : input;
  const ranked = planThumbnailStudies(available)
    .map((study) => alignedStudy(study, decision))
    .filter(
      (study) => study.marks.length > 0 || !repeatedKinds.has(study.kind),
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
    const model = selectCompositionModels(available).find(
      (candidate) =>
        !covered.has(candidate.id) &&
        !current.some((structure) =>
          currentModel[structure.type]?.includes(candidate.id),
        ) &&
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
