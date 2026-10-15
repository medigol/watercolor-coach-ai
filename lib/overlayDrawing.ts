import { overlayCategory, overlayKind, type CoachingOverlay } from "./overlays";
import {
  legacyGeometry,
  noteAnchor,
  noteRegion,
  noteRegions,
  noteGeometryVisible,
  projectPoint,
  projectRect,
  type ImageFrame,
} from "./imageGeometry";
export type LegendGroup =
  | "Focus"
  | "Value"
  | "Simplify"
  | "Edge"
  | "Composition";
const categoryGroups = {
  focal_point: "Focus",
  composition: "Composition",
  value_structure: "Value",
  simplification: "Simplify",
  edge_control: "Edge",
  atmosphere: "Simplify",
  color_temperature: "Value",
  reserve_light: "Value",
} as const;
export function legendGroup(note: CoachingOverlay): LegendGroup {
  return categoryGroups[overlayCategory(note)];
}
export const markColors: Record<LegendGroup, string> = {
  Focus: "#AA7939",
  Value: "#4B6D83",
  Simplify: "#236963",
  Edge: "#A9715A",
  Composition: "#536571",
};
// Only number labels may move to avoid blocked touch targets. The drawn geometry
// continues to use the supplied image coordinates without inferred regions.
export function markerPositions(
  notes: CoachingOverlay[],
  width: number,
  height: number,
  frame: Pick<ImageFrame, "x" | "y" | "width" | "height"> = {
    x: 0,
    y: 0,
    width,
    height,
  },
) {
  const target = Math.max(1, Math.min(44, width, height));
  const positions: { left: number; top: number; target: number }[] = [];
  for (const note of notes) {
    const normalizedAnchor = noteAnchor(note);
    if (!noteGeometryVisible(note) || !normalizedAnchor) {
      positions.push({ left: 0, top: 0, target: 0 });
      continue;
    }
    const anchor = projectPoint(normalizedAnchor, frame);
    const clamp = (dx: number, dy: number) => ({
      left: Math.max(0, Math.min(width - target, anchor.x - target / 2 + dx)),
      top: Math.max(0, Math.min(height - target, anchor.y - target / 2 + dy)),
      target,
    });
    const candidates = [clamp(0, 0)];
    for (let ring = 1; ring <= 3; ring++) {
      const shift = (target + 2) * ring;
      for (const [dx, dy] of [
        [-shift, 0],
        [shift, 0],
        [0, -shift],
        [0, shift],
        [-shift, -shift],
        [shift, -shift],
        [-shift, shift],
        [shift, shift],
      ])
        candidates.push(clamp(dx, dy));
    }
    const collision = (p: (typeof positions)[number]) =>
      positions.some(
        (other) =>
          other.target > 0 &&
          p.left < other.left + target + 1 &&
          p.left + target + 1 > other.left &&
          p.top < other.top + target + 1 &&
          p.top + target + 1 > other.top,
      );
    positions.push(candidates.find((p) => !collision(p)) ?? candidates[0]);
  }
  return positions;
}
export function markGeometry(
  note: CoachingOverlay,
  width: number,
  height: number,
  frame: Pick<ImageFrame, "x" | "y" | "width" | "height"> = {
    x: 0,
    y: 0,
    width,
    height,
  },
) {
  const normalized = legacyGeometry(note);
  let kind = overlayKind(note);
  const explicitRegion = note.region != null ? noteRegion(note) : null;
  const point = projectPoint(
    explicitRegion
      ? {
          x: explicitRegion.x + explicitRegion.width / 2,
          y: explicitRegion.y + explicitRegion.height / 2,
        }
      : (normalized?.point ?? { x: 0, y: 0 }),
    frame,
  );
  const regionShape = [
    "focal_ring",
    "crop_box",
    "region_highlight",
    "value_mass",
  ].includes(kind);
  const sourceRect =
    explicitRegion && regionShape ? explicitRegion : normalized?.rect;
  const rect = sourceRect ? projectRect(sourceRect, frame) : null;
  let sourcePoints = normalized?.points ?? [];
  if (explicitRegion && regionShape) {
    // New normalized regions are authoritative. An older polygon/box may have
    // survived beside them in saved JSON; do not draw two conflicting targets.
    sourcePoints = [];
  } else if (
    explicitRegion &&
    sourcePoints.some(
      (p) =>
        p.x < explicitRegion.x - 1e-7 ||
        p.y < explicitRegion.y - 1e-7 ||
        p.x > explicitRegion.x + explicitRegion.width + 1e-7 ||
        p.y > explicitRegion.y + explicitRegion.height + 1e-7,
    )
  ) {
    // Preserve an actual path only when it agrees with the supplied local
    // target. A contradictory path is omitted, never moved or redrawn.
    sourcePoints = [];
    kind = "point_marker";
  }
  const points = sourcePoints.map((p) => projectPoint(p, frame));
  return {
    kind,
    x: rect?.x ?? point.x,
    y: rect?.y ?? point.y,
    width: rect?.width ?? 0,
    height: rect?.height ?? 0,
    points,
  };
}
export function activeRegionGeometry(
  note: CoachingOverlay,
  width: number,
  height: number,
  frame: Pick<ImageFrame, "x" | "y" | "width" | "height"> = {
    x: 0,
    y: 0,
    width,
    height,
  },
) {
  const region = noteRegion(note);
  return region ? projectRect(region, frame) : null;
}
export function activeRegionsGeometry(
  note: CoachingOverlay,
  width: number,
  height: number,
  frame: Pick<ImageFrame, "x" | "y" | "width" | "height"> = {
    x: 0,
    y: 0,
    width,
    height,
  },
) {
  if (!noteGeometryVisible(note)) return [];
  return noteRegions(note).map((region) => projectRect(region, frame));
}
export function arrowHead(points: { x: number; y: number }[], length = 10) {
  if (points.length < 2) return "";
  const b = points[points.length - 1];
  const a = points
    .slice(0, -1)
    .reverse()
    .find((p) => Math.abs(p.x - b.x) + Math.abs(p.y - b.y) > 0.000001);
  if (!a) return "";
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const left = {
    x: b.x - length * Math.cos(angle - Math.PI / 6),
    y: b.y - length * Math.sin(angle - Math.PI / 6),
  };
  const right = {
    x: b.x - length * Math.cos(angle + Math.PI / 6),
    y: b.y - length * Math.sin(angle + Math.PI / 6),
  };
  return `M ${left.x} ${left.y} L ${b.x} ${b.y} L ${right.x} ${right.y}`;
}
