import {
  overlayAnchor,
  overlayCategory,
  overlayKind,
  type CoachingOverlay,
} from "./overlays";
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
) {
  const target = Math.max(1, Math.min(44, width, height));
  const positions: { left: number; top: number; target: number }[] = [];
  for (const note of notes) {
    const anchor = overlayAnchor(note);
    const clamp = (dx: number, dy: number) => ({
      left: Math.max(
        0,
        Math.min(width - target, (width * anchor.x) / 100 - target / 2 + dx),
      ),
      top: Math.max(
        0,
        Math.min(height - target, (height * anchor.y) / 100 - target / 2 + dy),
      ),
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
) {
  const points = (note.points ?? []).map((p) => ({
    x: (p.x * width) / 100,
    y: (p.y * height) / 100,
  }));
  return {
    kind: overlayKind(note),
    x: (note.x * width) / 100,
    y: (note.y * height) / 100,
    width: ((note.width ?? 0) * width) / 100,
    height: ((note.height ?? 0) * height) / 100,
    points,
  };
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
