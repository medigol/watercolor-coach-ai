import {
  usableCompositionOverlay,
  visualRoles,
  type VisualRole,
} from "../shared/visualMetadata";
import {
  validRect,
  noteGeometryVisible,
  noteRegions,
  type NormalizedPoint,
  type NormalizedRect,
} from "./imageGeometry";
import type { PaintingRole } from "../shared/paintingAnalysis";

export type VisualRoleRegion =
  | { kind: "rectangle"; role: VisualRole; region: NormalizedRect }
  | { kind: "polygon"; role: VisualRole; points: NormalizedPoint[] };

export function visualRoleLabel(role: VisualRole): string {
  return { focal: "Focal", supporting: "Supporting", quiet: "Quiet" }[role];
}

function fingerprint(item: VisualRoleRegion): string {
  const points =
    item.kind === "polygon"
      ? item.points
      : [
          { x: item.region.x, y: item.region.y },
          { x: item.region.x + item.region.width, y: item.region.y },
          {
            x: item.region.x + item.region.width,
            y: item.region.y + item.region.height,
          },
          { x: item.region.x, y: item.region.y + item.region.height },
        ];
  // Shape identity only; original geometry is never rounded or changed.
  return [
    ...new Set(
      points.map((point) => `${point.x.toFixed(4)},${point.y.toFixed(4)}`),
    ),
  ]
    .sort()
    .join("|");
}

// Canonical roles own their located regions. Neither the selected expert view
// nor a note's prose or a secondary composition can redefine this map.
export function planCanonicalVisualRoles(
  roles: PaintingRole[],
): VisualRoleRegion[] {
  const located = roles.filter(
    (role) =>
      validRect(role.region) &&
      typeof role.confidence === "number" &&
      role.confidence >= 0.65 &&
      role.confidence <= 1,
  );
  const candidates = located.map((role) => ({
    kind: "rectangle" as const,
    role: role.role,
    region: role.region!,
  }));
  const consistent = candidates.filter(
    (region) =>
      !candidates.some(
        (other) =>
          other.role !== region.role &&
          fingerprint(other) === fingerprint(region),
      ),
  );
  const selected = visualRoles
    .map((role) => consistent.find((region) => region.role === role))
    .filter((region): region is NonNullable<typeof region> => !!region);
  return selected.length >= 2 &&
    selected.some((region) => region.role === "focal")
    ? selected
    : [];
}

/**
 * A selective view of explicitly located, confident hierarchy observations.
 * Names in the canonical decision are not geometry and cannot create a map.
 * Legacy notes without confidence continue to work as notes, without gaining
 * an authoritative-looking role map. Global notes never invent local regions.
 */
export function planVisualRoles(
  notes: unknown,
  compositionOverlay?: unknown,
): VisualRoleRegion[] {
  const candidates: { region: VisualRoleRegion; confidence: number }[] = [];
  if (Array.isArray(notes))
    for (const note of notes.slice(0, 12)) {
      if (
        !note ||
        typeof note !== "object" ||
        Array.isArray(note) ||
        !visualRoles.includes(note.visualRole) ||
        typeof note.regionConfidence !== "number" ||
        !Number.isFinite(note.regionConfidence) ||
        note.regionConfidence < 0.65 ||
        note.regionConfidence > 1 ||
        !noteGeometryVisible(note)
      )
        continue;
      for (const region of noteRegions(note)) {
        candidates.push({
          region: { kind: "rectangle", role: note.visualRole, region },
          confidence: note.regionConfidence,
        });
      }
    }
  const composition = usableCompositionOverlay(compositionOverlay);
  if (composition && composition.confidence >= 0.65) {
    for (const mass of composition.masses ?? []) {
      if (mass.role)
        candidates.push({
          region: { kind: "polygon", role: mass.role, points: mass.points },
          confidence: composition.confidence,
        });
    }
  }
  // A region assigned opposing roles is uncertain; omit that visual rather
  // than silently choosing a side. The original note text remains available.
  const roleSets = new Map<string, Set<VisualRole>>();
  for (const candidate of candidates) {
    const key = fingerprint(candidate.region);
    if (!roleSets.has(key)) roleSets.set(key, new Set());
    roleSets.get(key)!.add(candidate.region.role);
  }
  const consistent = candidates
    .filter(
      (candidate) => roleSets.get(fingerprint(candidate.region))!.size === 1,
    )
    .sort((first, second) => second.confidence - first.confidence);
  const selected = visualRoles
    .map(
      (role) =>
        consistent.find((candidate) => candidate.region.role === role)?.region,
    )
    .filter((region): region is VisualRoleRegion => !!region);
  // One focal group and a related supporting/quiet group make a useful lesson.
  // A single labelled area, or two non-focal areas alone, is not a hierarchy.
  return selected.length >= 2 &&
    selected.some((region) => region.role === "focal")
    ? selected
    : [];
}
