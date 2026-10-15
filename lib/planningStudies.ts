import type { CompositionModel } from "./compositionModels";
import {
  planThumbnailStudies,
  type ThumbnailKind,
  type ThumbnailPlanningInput,
  type ThumbnailStudy,
} from "./thumbnailPlanning";
import {
  conflictsWithDecision,
  usableCoachingDecision,
} from "./coachingDecision";
import {
  drawableCompositionOverlay,
  compositionIdentity,
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

const studyKinds: ThumbnailKind[] = [
  "crop",
  "eye_flow",
  "big_shapes",
  "value_mass",
  "simplification",
  "horizon",
  "focal_point",
  "edge_control",
];

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
  const current = primary
    ? [
        primary,
        ...(secondary &&
        compositionIdentity(secondary) !== compositionIdentity(primary)
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
      ? studyKinds.filter((kind) => imageStudyMarks(kind, repeated).length > 0)
      : [],
  );
  // Re-rank after removing exact duplicates so a lower-ranked alternate crop or
  // eye path can still earn a place. Saved data itself is never rewritten.
  const available = current.length
    ? { ...input, overlays: notes.filter((note) => !repeated.includes(note)) }
    : input;
  const ranked = planThumbnailStudies(available)
    .filter(
      (study) =>
        !decision ||
        ![study.purpose, study.action].some((text) =>
          conflictsWithDecision(text, decision),
        ),
    )
    .filter(
      (study) => study.marks.length > 0 || !repeatedKinds.has(study.kind),
    );
  return ranked.slice(0, 2).map((study) => ({
    type: "thumbnail",
    source: study.marks.length ? "image" : "generic",
    study,
  }));
}
