import type {
  PaintingAnalysisResult,
  PaintingInsight,
  PaintingRole,
} from "../shared/paintingAnalysis";
import {
  cropView,
  noteRegions,
  validRect,
  validSize,
  projectRect,
  type NormalizedRect,
  type ImageSize,
} from "../shared/imageGeometry";
import {
  drawableCompositionOverlay,
  type CompositionOverlay,
} from "../shared/visualMetadata";
import { compositionIdentity } from "../shared/visualMetadata";
import { objectDesignSuggestion } from "../shared/coachingLanguage";

export interface EvidenceRegion {
  region: NormalizedRect;
  label: string;
}
export interface TeachingEvidence {
  label: string;
  kind: "local" | "whole" | "comparison" | "location";
  regions: EvidenceRegion[];
  value?: boolean;
  insightId?: string;
  noteId?: string;
  composition?: CompositionOverlay;
}
export type EvidencePlacement =
  | { plan: TeachingEvidence }
  | { reference: { key: string; label: string } };

/** Number source areas without inferring subject identities from their order. */
export function sourceAreaCaption(label: unknown, index?: number): string {
  const supplied = typeof label === "string" ? label.trim() : "";
  const semantic = /\brelated passages?\b/i.test(supplied) ? "" : supplied;
  if (index === undefined) return semantic || "Multiple source areas";
  return semantic
    ? `${semantic} · area ${index + 1}`
    : `Source area ${index + 1}`;
}

function reliable(confidence: unknown): boolean {
  return (
    typeof confidence === "number" &&
    Number.isFinite(confidence) &&
    confidence >= 0.65 &&
    confidence <= 1
  );
}
export function usefulLocalRegion(region: unknown): region is NormalizedRect {
  return (
    validRect(region) &&
    region.width >= 0.025 &&
    region.height >= 0.025 &&
    region.width * region.height < 0.72
  );
}
export function evidenceCrop(
  region: NormalizedRect,
  source: ImageSize,
  viewport: ImageSize,
) {
  if (
    !usefulLocalRegion(region) ||
    !validSize(source) ||
    region.width * source.width < 2 ||
    region.height * source.height < 2
  )
    return null;
  // Presentation context only: retain the canonical target, but give narrow
  // towers/strips enough neighbouring image to read as a painting passage.
  const padding = 0.12 + 0.13 * (1 - Math.sqrt(region.width * region.height));
  const width = Math.min(
    1,
    Math.max(
      region.width,
      0.18,
      Math.min(0.55, ((region.height * source.height) / source.width) * 0.65),
    ),
  );
  const height = Math.min(
    1,
    Math.max(
      region.height,
      0.16,
      Math.min(0.45, (region.width * source.width) / source.height / 2),
    ),
  );
  const context = {
    x: Math.max(
      0,
      Math.min(1 - width, region.x + region.width / 2 - width / 2),
    ),
    y: Math.max(
      0,
      Math.min(1 - height, region.y + region.height / 2 - height / 2),
    ),
    width,
    height,
  };
  const crop = cropView(context, source, viewport, padding, 1);
  if (!crop) return null;
  const target = projectRect(region, crop.image);
  return target.width >= 4 && target.height >= 4 ? { ...crop, target } : null;
}
function locatedRole(role: PaintingRole | undefined): EvidenceRegion[] {
  return role && reliable(role.confidence) && usefulLocalRegion(role.region)
    ? [{ region: role.region, label: role.area }]
    : [];
}

/** Resolve explicit evidence links only. Never locate an area by parsing prose. */
export function insightEvidence(
  source: PaintingAnalysisResult,
  insight: PaintingInsight,
): TeachingEvidence | null {
  const c = source.canonicalAnalysis;
  const facts = insight.factIds.flatMap((id) =>
    c.facts.filter((f) => f.id === id),
  );
  if (!facts.length) return null;
  const linked =
    c.visualEvidence?.filter((v) => v.insightId === insight.id) ?? [];
  const note = linked[0]?.note;
  const base = {
    label: facts.map((f) => f.observation).join(" "),
    insightId: insight.id,
    noteId: typeof note?.id === "string" ? note.id : undefined,
    value:
      insight.domain === "colour_value" &&
      /\b(?:value|contrast|dark|light|shadow)\b/i.test(
        `${facts.map((f) => f.observation).join(" ")} ${insight.lesson}`,
      ),
  };
  if (objectDesignSuggestion(insight.action)) {
    if (
      !["composition", "overall"].includes(insight.domain) ||
      !note ||
      note.timing !== "next_study" ||
      !reliable(note.regionConfidence)
    )
      return null;
    const regions = noteRegions(note).filter(usefulLocalRegion);
    return regions.length === 1
      ? {
          ...base,
          kind: "location",
          value: false,
          regions: [
            {
              region: regions[0],
              label: /\b(?:figures?|people|person)\b/i.test(insight.action)
                ? "Possible figure area · future study"
                : "Possible object area · future study",
            },
          ],
        }
      : null;
  }
  // A declared global topic must not inherit a local role crop.
  if (
    insight.domain === "composition" ||
    linked.some((e) => e.note.scope === "global") ||
    facts.some((f) => f.roleId === null)
  )
    return { ...base, kind: "whole", regions: [] };
  if (note && reliable(note.regionConfidence)) {
    const regions = noteRegions(note)
      .filter(usefulLocalRegion)
      .map((region, index, all) => ({
        region,
        label:
          all.length > 1
            ? sourceAreaCaption(
                typeof note.label === "string" && note.label.trim()
                  ? note.label
                  : base.label,
                index,
              )
            : sourceAreaCaption(note.label || base.label),
      }));
    if (note.scope === "multi_region" && regions.length < 2)
      return { ...base, kind: "whole", regions: [] };
    if (regions.length)
      return {
        ...base,
        kind: regions.length > 1 ? "comparison" : "local",
        regions: regions.slice(0, 3),
      };
    if (Object.hasOwn(note, "region") || Object.hasOwn(note, "regions"))
      return { ...base, kind: "whole", regions: [] };
  }
  // Explicit uncertainty takes precedence over a confident-looking fallback.
  if (
    note &&
    Object.hasOwn(note, "regionConfidence") &&
    !reliable(note.regionConfidence)
  )
    return { ...base, kind: "whole", regions: [] };
  const ids = [...new Set(facts.map((f) => f.roleId))];
  const regions = ids.flatMap((id) =>
    locatedRole(c.visualRoles.find((r) => r.id === id)),
  );
  return {
    ...base,
    kind:
      regions.length > 1 ? "comparison" : regions.length ? "local" : "whole",
    regions: regions.slice(0, 3),
  };
}

export function colourEvidence(
  source: PaintingAnalysisResult,
  roleId: string | null,
  label: string,
): TeachingEvidence | null {
  if (!roleId) return null;
  const c = source.canonicalAnalysis;
  if (!c.visualRoles.some((r) => r.id === roleId)) return null;
  const linked = c.visualEvidence?.find(
    (v) =>
      v.roleId === roleId &&
      v.note.scope === "local" &&
      reliable(v.note.regionConfidence) &&
      c.insights.some(
        (i) =>
          i.id === v.insightId &&
          i.factIds.some((id) =>
            c.facts.some((f) => f.id === id && f.roleId === roleId),
          ),
      ) &&
      noteRegions(v.note).length === 1 &&
      usefulLocalRegion(noteRegions(v.note)[0]),
  );
  if (linked)
    return {
      label,
      kind: "local",
      regions: [{ region: noteRegions(linked.note)[0], label }],
    };
  const regions = locatedRole(
    source.canonicalAnalysis.visualRoles.find((r) => r.id === roleId),
  );
  return regions.length
    ? { label, kind: "local", regions: regions.map((r) => ({ ...r, label })) }
    : null;
}
export function compositionEvidence(overlay: unknown): TeachingEvidence | null {
  const composition = drawableCompositionOverlay(overlay);
  return composition
    ? {
        kind: "whole",
        label: composition.shortExplanation,
        regions: [],
        composition,
      }
    : null;
}

/** Stable presentation identity only; original coordinates remain untouched. */
export function evidenceIdentity(plan: TeachingEvidence): string {
  if (plan.composition)
    return `composition:${compositionIdentity(plan.composition)}`;
  if (plan.kind === "whole") return "whole";
  return `${plan.kind === "location" ? "location" : "region"}:${plan.regions
    .map(({ region: r }) =>
      [r.x, r.y, r.width, r.height].map((v) => v.toFixed(4)).join(","),
    )
    .sort()
    .join("|")}`;
}
export function allocateEvidence(
  requests: { key: string; label: string; plan: TeachingEvidence | null }[],
  limit = 4,
): Record<string, EvidencePlacement> {
  const result: Record<string, EvidencePlacement> = {};
  const owners = new Map<string, { key: string; label: string }>();
  for (const request of requests) {
    if (Object.hasOwn(result, request.key)) continue;
    if (!request.plan) continue;
    const identity = evidenceIdentity(request.plan),
      owner = owners.get(identity);
    if (owner) {
      const previous = result[owner.key];
      if (request.plan.value && previous && "plan" in previous)
        result[owner.key] = { plan: { ...previous.plan, value: true } };
      result[request.key] = { reference: owner };
    } else if (owners.size < limit) {
      result[request.key] = { plan: request.plan };
      owners.set(identity, { key: request.key, label: request.label });
    } else
      result[request.key] = {
        reference: { key: "artwork", label: "Original painting" },
      };
  }
  return result;
}
