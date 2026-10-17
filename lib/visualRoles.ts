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
import type {
  PaintingAnalysisResult,
  PaintingRole,
} from "../shared/paintingAnalysis";

const structuralField =
  /\b(?:roads?|streets?|paths?|foreground|lead[- ]ins?)\b/i;
const structurallyActive =
  /\b(?:directional\s+)?lead[- ]in\b|\b(?:leads?|leading|guides?|guiding|draws?|drawing|carry|carries|carrying|directs?|directing|pulls?|pulling)\b[^.!?]{0,80}\b(?:eye|gaze|toward|through|focal)\b|\b(?:strong|major|dominant|significant|structural)\b[^.!?]{0,40}\b(?:value|tonal|dark|foreground|perspective|direction|flow|mass|path)\b|\b(?:road|street|path|foreground)\b[^.!?]{0,40}\b(?:anchors?|structures?|direction|flow|perspective|connects?)\b|\b(?:receding|converging|perspective)\s+(?:lines|edges|path|road)\b/i;
const explicitQuiet =
  /\bquiet\b|\blow[- ](?:contrast|information|detail)\b|\b(?:minimal|little|few)\s+(?:detail|details|texture|contrast|marks)\b|\b(?:visually\s+)?subordinate\b|\b(?:unbroken|uncluttered|uneventful)\s+(?:space|passage|area|field)\b/i;

/**
 * A display-only omission, never a new role assignment. A non-focal road or
 * foreground may carry structure, so its quiet label needs affirmative supplied
 * evidence and must not contradict an explicitly active spatial relationship.
 * Canonical roles, facts, IDs and geometry remain untouched in saved data.
 */
export function displayRoleProjection(
  canonical: Pick<
    PaintingAnalysisResult["canonicalAnalysis"],
    "visualRoles" | "facts" | "insights" | "visualEvidence"
  >,
) {
  const suppressedRoleIds = canonical.visualRoles
    .filter((role) => {
      if (role.role !== "quiet") return false;
      const facts = canonical.facts
        .filter((fact) => fact.roleId === role.id)
        .map((fact) => fact.observation);
      const supplied = [role.area, ...facts].join(". ");
      if (!structuralField.test(supplied)) return false;
      // The label "quiet foreground" alone cannot substantiate itself. An
      // independent linked observation must explain its subdued visual effect.
      return (
        structurallyActive.test(supplied) ||
        !facts.some((observation) => explicitQuiet.test(observation))
      );
    })
    .map((role) => role.id);
  const suppressed = new Set(suppressedRoleIds);
  return {
    suppressedRoleIds,
    visualRoles: canonical.visualRoles.filter(
      (role) => !suppressed.has(role.id),
    ),
    visualEvidence: canonical.visualEvidence?.filter((evidence) => {
      if (evidence.roleId && suppressed.has(evidence.roleId)) return false;
      // Legacy optional notes can have a null role reference. Remove an
      // explicitly quiet annotation only when its actual fact links identify
      // the omitted role; unrelated advice and original geometry are retained.
      if (
        evidence.roleId == null &&
        (evidence.note.visualRole === "quiet" ||
          (typeof evidence.note.label === "string" &&
            /\bquiet\b/i.test(evidence.note.label)))
      ) {
        const insight = canonical.insights.find(
          (item) => item.id === evidence.insightId,
        );
        if (
          insight?.factIds.some((id) =>
            canonical.facts.some(
              (fact) =>
                fact.id === id &&
                fact.roleId !== null &&
                suppressed.has(fact.roleId),
            ),
          )
        )
          return false;
      }
      return true;
    }),
  };
}

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
      role.confidence <= 1 &&
      // Very broad or uncertain boxes communicate false localisation. The
      // canonical role text remains visible even when its geometry is omitted.
      role.region!.width * role.region!.height < 0.8 &&
      (role.confidence >= 0.8 ||
        role.region!.width * role.region!.height < 0.5),
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
