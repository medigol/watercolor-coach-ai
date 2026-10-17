// INTERNAL provider contract only. Saved/public PaintingAnalysisResult stays v1.
// No I/O, random IDs, prose generation, inferred geometry or provider retries.
import {
  expertViewKeys,
  qualityLevels,
  type ExpertViewKey,
  type PaintingFact,
  type PaintingInsight,
  type PaintingRole,
} from "./paintingAnalysis.ts";
import {
  feedbackClassifications,
  visualRoles,
  usableCompositionOverlay,
} from "./visualMetadata.ts";
import { validRect, type NormalizedRect } from "./imageGeometry.ts";
import { colourAnalysisSchema } from "./colourAnalysis.ts";
import { observationText, suggestedMethodText } from "./coachingEvidence.ts";
import { qualityRationaleText } from "./coachingLanguage.ts";

export const providerFailureReasons = [
  "core_text",
  "missing_domain",
  "provider_structure",
  "unrecoverable_reference",
  "unrecoverable_roles",
  "empty_analysis",
  "unknown",
] as const;
export type ProviderFailureReason = (typeof providerFailureReasons)[number];
interface DraftFact {
  observation: string;
  roleIndex: number | null;
}
interface DraftInsight {
  classification: PaintingInsight["classification"];
  factRefs: number[];
  lesson: string;
  action: string;
}
interface DraftVisual {
  insightIndex: number;
  label: string;
  regions: NormalizedRect[];
  confidence: number | null;
  timing: "current_painting" | "next_study" | "both";
}
interface DraftDomain {
  facts: DraftFact[];
  insights: DraftInsight[];
  practice: string | null;
  visualAids: DraftVisual[] | null;
}
export interface ProviderPaintingAnalysisDraft {
  title: string;
  qualityAssessment: {
    level: (typeof qualityLevels)[number];
    confidence: number;
    rationale: string;
  };
  visualRoles: Omit<PaintingRole, "id">[] | null;
  compositionStructure: {
    observation: string;
    primary: unknown;
    secondary: unknown;
  };
  overall: DraftDomain;
  composition: DraftDomain;
  colourValue: DraftDomain & { colourAnalysis: unknown };
  technique: DraftDomain;
  brushPlan: unknown;
}
const domain = {
  overall: "overall",
  composition: "composition",
  colourValue: "colour_value",
  technique: "technique",
} as const;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max: number): v is string =>
  typeof v === "string" && !!v.trim() && v.length <= max;
const unit = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
const indexIn = (v: unknown, length: number): v is number =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) < length;
const areaKey = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");
const fail = (reason: ProviderFailureReason) => ({
  ok: false as const,
  reason,
});

/** Role meaning is optional metadata. Ambiguity removes the affected role and
 * its references, never silently relabels focal/supporting/quiet. */
function draftRoles(value: unknown) {
  const rows = Array.isArray(value) ? value.slice(0, 6) : [];
  const groups = new Map<
    string,
    { row: Record<string, unknown>; index: number }[]
  >();
  rows.forEach((row, index) => {
    if (
      !record(row) ||
      !text(row.area, 80) ||
      !visualRoles.includes(row.role as never)
    )
      return;
    const key = areaKey(row.area);
    groups.set(key, [...(groups.get(key) ?? []), { row, index }]);
  });
  const selected = [...groups.values()].flatMap((group) => {
    if (new Set(group.map(({ row }) => row.role)).size !== 1) return [];
    const score = ({ row }: (typeof group)[number]) => [
      validRect(row.region) ? 1 : 0,
      unit(row.confidence) ? row.confidence : -1,
    ];
    const ordered = [...group].sort(
      (a, b) =>
        score(b)[0] - score(a)[0] ||
        score(b)[1] - score(a)[1] ||
        a.index - b.index,
    );
    const best = ordered[0];
    const tied = ordered.filter(
      (r) => score(r)[0] === score(best)[0] && score(r)[1] === score(best)[1],
    );
    const geometryKey = (v: unknown) =>
      validRect(v) ? [v.x, v.y, v.width, v.height].join(",") : "none";
    // The common semantic role remains useful as text; disputed geometry does not.
    const region =
      !unit(best.row.confidence) ||
      best.row.confidence < 0.65 ||
      tied.some(
        ({ row }) => geometryKey(row.region) !== geometryKey(best.row.region),
      )
        ? null
        : validRect(best.row.region)
          ? best.row.region
          : null;
    return [{ group, best, region }];
  });
  const focalCount = selected.filter(
    ({ best }) => best.row.role === "focal",
  ).length;
  const roles: PaintingRole[] = [];
  const ids = new Map<number, string>();
  for (const { group, best, region } of selected) {
    if (best.row.role === "focal" && focalCount > 1) continue;
    const id = `role_${best.index + 1}`;
    roles.push({
      id,
      area: best.row.area as string,
      role: best.row.role as PaintingRole["role"],
      region,
      confidence: unit(best.row.confidence) ? best.row.confidence : null,
    });
    for (const row of group) ids.set(row.index, id);
  }
  return { roles, ids };
}

export function normalizeProviderPaintingAnalysis(
  value: unknown,
):
  | { ok: true; result: unknown }
  | { ok: false; reason: ProviderFailureReason } {
  if (!record(value)) return fail("provider_structure");
  if (!text(value.title, 100)) return fail("core_text");
  const q = value.qualityAssessment;
  if (
    !record(q) ||
    !qualityLevels.includes(q.level as never) ||
    !unit(q.confidence) ||
    !text(q.rationale, 640)
  )
    return fail("provider_structure");
  const rationale = qualityRationaleText(q.rationale);
  if (!rationale) return fail("core_text");
  const structure = value.compositionStructure;
  if (!record(structure) || !text(structure.observation, 240))
    return fail("provider_structure");
  const compositionObservation = observationText(structure.observation);
  if (!compositionObservation) return fail("core_text");
  const { roles, ids: roleIds } = draftRoles(value.visualRoles);
  const facts: PaintingFact[] = [],
    insights: PaintingInsight[] = [];
  const expertViews: Record<string, unknown> = {};
  const visualEvidence: Record<string, unknown>[] = [];
  const insightIds = new Map<ExpertViewKey, Map<number, string>>();
  for (const key of expertViewKeys) {
    const block = value[key];
    if (!record(block)) return fail("missing_domain");
    if (
      !Array.isArray(block.facts) ||
      !Array.isArray(block.insights) ||
      block.facts.length > 8 ||
      block.insights.length > 12
    )
      return fail("provider_structure");
    if (!block.facts.length || !block.insights.length)
      return fail("empty_analysis");
    const rawFacts = block.facts,
      rawInsights = block.insights;
    const factIds = new Map<number, string>();
    for (const [index, row] of rawFacts.entries()) {
      if (!record(row) || !text(row.observation, 240)) return fail("core_text");
      const observation = observationText(row.observation);
      if (!observation) continue; // e.g. a broken optional technique sentence
      const id = `fact_${domain[key]}_${index + 1}`;
      factIds.set(index, id);
      facts.push({
        id,
        domain: domain[key],
        observation,
        roleId:
          typeof row.roleIndex === "number"
            ? (roleIds.get(row.roleIndex) ?? null)
            : null,
      });
    }
    const local: PaintingInsight[] = [],
      localIds = new Map<number, string>();
    for (const [index, row] of rawInsights.entries()) {
      if (
        !record(row) ||
        !feedbackClassifications.includes(row.classification as never) ||
        !Array.isArray(row.factRefs) ||
        !row.factRefs.length ||
        row.factRefs.length > 3
      )
        return fail("provider_structure");
      if (!row.factRefs.every((ref) => indexIn(ref, rawFacts.length)))
        return fail("unrecoverable_reference");
      if (!text(row.lesson, 240) || !text(row.action, 180))
        return fail("core_text");
      const refs = [
        ...new Set(row.factRefs.flatMap((ref) => factIds.get(ref) ?? [])),
      ];
      const lesson = observationText(row.lesson),
        action = observationText(row.action);
      if (!refs.length || !lesson || !action) continue;
      const id = `insight_${domain[key]}_${index + 1}`;
      localIds.set(index, id);
      local.push({
        id,
        domain: domain[key],
        classification: row.classification as PaintingInsight["classification"],
        factIds: refs,
        lesson,
        action,
      });
    }
    if (!local.length) return fail("core_text");
    insightIds.set(key, localIds);
    insights.push(...local);
    const priority = (i: PaintingInsight) =>
      i.classification === "clear_issue"
        ? 3
        : i.classification === "optional_refinement"
          ? 2
          : i.classification === "strength"
            ? 1
            : 0;
    const summary = [...local].sort((a, b) => priority(b) - priority(a))[0];
    const limit = key === "overall" ? 2 : 3;
    const chosen = local.slice(0, limit);
    if (!chosen.includes(summary)) chosen[chosen.length - 1] = summary;
    expertViews[key] = {
      summaryId: summary.id,
      insightIds: chosen.map((i) => i.id),
      practice:
        typeof block.practice === "string" && block.practice.length <= 640
          ? suggestedMethodText(block.practice)
          : "",
    };
    if (!Array.isArray(block.visualAids)) continue;
    for (const [index, aid] of block.visualAids.slice(0, 3).entries()) {
      if (
        !record(aid) ||
        !indexIn(aid.insightIndex, rawInsights.length) ||
        !text(aid.label, 70) ||
        !unit(aid.confidence) ||
        aid.confidence < 0.65 ||
        !["current_painting", "next_study", "both"].includes(
          aid.timing as string,
        ) ||
        !Array.isArray(aid.regions) ||
        aid.regions.length < 1 ||
        aid.regions.length > 3 ||
        !aid.regions.every(validRect)
      )
        continue;
      const aidIndex = aid.insightIndex;
      const linked = local.find((i) => i.id === localIds.get(aidIndex));
      if (!linked) continue;
      const referenced = facts.filter((f) => linked.factIds.includes(f.id));
      const role = referenced[0]?.roleId;
      const roleId =
        role && referenced.every((f) => f.roleId === role) ? role : null;
      const region = aid.regions[0] as NormalizedRect;
      visualEvidence.push({
        insightId: linked.id,
        roleId,
        note: {
          id: `note_${domain[key]}_${index + 1}`,
          type: "region_highlight",
          category:
            key === "technique"
              ? "edge_control"
              : key === "colourValue"
                ? "value_structure"
                : "composition",
          label: aid.label,
          shortInstruction: aid.label,
          x: region.x * 100,
          y: region.y * 100,
          width: region.width * 100,
          height: region.height * 100,
          ...(aid.regions.length === 1 ? { region } : { regions: aid.regions }),
          scope: aid.regions.length === 1 ? "local" : "multi_region",
          regionConfidence: aid.confidence,
          timing: ["stylistic_alternative", "study_experiment"].includes(
            linked.classification,
          )
            ? "next_study"
            : aid.timing,
          priority:
            linked.classification === "clear_issue"
              ? "high"
              : linked.classification === "optional_refinement"
                ? "medium"
                : "low",
        },
      });
    }
  }
  if (facts.length > 8 || insights.length > 12)
    return fail("provider_structure");
  const colourBlock = value.colourValue as Record<string, unknown>;
  const rawColour = colourBlock.colourAnalysis;
  const colourAnalysis = record(rawColour)
    ? {
        ...rawColour,
        visibleColours: Array.isArray(rawColour.visibleColours)
          ? rawColour.visibleColours.map((c) =>
              record(c)
                ? {
                    label: c.label,
                    approximateHex: c.approximateHex,
                    roleId:
                      typeof c.roleIndex === "number"
                        ? (roleIds.get(c.roleIndex) ?? null)
                        : null,
                  }
                : c,
            )
          : [],
        technicalAssessment: record(rawColour.technicalAssessment)
          ? {
              ...rawColour.technicalAssessment,
              insightId:
                insightIds
                  .get("colourValue")
                  ?.get(rawColour.technicalAssessment.insightIndex as number) ??
                null,
            }
          : null,
      }
    : null;
  return {
    ok: true,
    result: {
      title: value.title,
      canonicalAnalysis: {
        version: 1,
        qualityAssessment: { ...q, rationale },
        visualRoles: roles,
        facts,
        composition: {
          observation: compositionObservation,
          primary: usableCompositionOverlay(structure.primary),
          secondary: usableCompositionOverlay(structure.secondary),
        },
        insights,
        visualEvidence: visualEvidence
          .sort((a, b) => {
            const weight = (e: Record<string, unknown>) =>
              record(e.note)
                ? e.note.priority === "high"
                  ? 2
                  : e.note.priority === "medium"
                    ? 1
                    : 0
                : 0;
            return weight(b) - weight(a);
          })
          .slice(0, 3),
        colourAnalysis,
        palette: null,
        brushPlan: value.brushPlan ?? null,
      },
      expertViews,
    },
  };
}

/** A public error code can only come from this fixed mapping, never model text. */
export function safeProviderFailureReason(
  code: unknown,
): ProviderFailureReason {
  if (providerFailureReasons.includes(code as never))
    return code as ProviderFailureReason;
  if (["core_text_cleaning", "quality_assessment"].includes(code as string))
    return "core_text";
  if (code === "missing_domain_insight" || code === "expert_views")
    return "missing_domain";
  if (
    [
      "visual_roles",
      "duplicate_role_ids",
      "duplicate_role_areas",
      "conflicting_roles",
      "multiple_focal_roles",
    ].includes(code as string)
  )
    return "unrecoverable_roles";
  if (
    [
      "view_reference",
      "view_domain_mismatch",
      "fact_reference",
      "insight_fact_reference",
    ].includes(code as string)
  )
    return "unrecoverable_reference";
  return code === null || code === undefined ? "unknown" : "provider_structure";
}

export function providerPaintingAnalysisSchema(aids: {
  structure: unknown;
  brush: unknown;
}) {
  const object = (properties: Record<string, unknown>) => ({
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  });
  const string = (maxLength: number) => ({
    type: "string",
    minLength: 1,
    maxLength,
  });
  const array = (items: unknown, maxItems: number, minItems = 0) => ({
    type: "array",
    items,
    maxItems,
    minItems,
  });
  const unit = { type: "number", minimum: 0, maximum: 1 };
  const roleIndex = { type: ["integer", "null"], minimum: 0, maximum: 5 };
  const rect = object({ x: unit, y: unit, width: unit, height: unit });
  const definitions = {
    fact: object({ observation: string(240), roleIndex }),
    insight: object({
      classification: { type: "string", enum: [...feedbackClassifications] },
      factRefs: array({ type: "integer", minimum: 0, maximum: 1 }, 3, 1),
      lesson: string(240),
      action: string(180),
    }),
    composition: aids.structure,
  };
  const block = (maxFacts: number, maxInsights: number) => ({
    facts: array({ $ref: "#/$defs/fact" }, maxFacts, 1),
    insights: array({ $ref: "#/$defs/insight" }, maxInsights, 1),
    practice: { type: ["string", "null"], maxLength: 640 },
    visualAids: {
      ...array(
        object({
          insightIndex: {
            type: "integer",
            minimum: 0,
            maximum: maxInsights - 1,
          },
          label: string(70),
          regions: array(rect, 3),
          confidence: { ...unit, type: ["number", "null"] },
          timing: {
            type: "string",
            enum: ["current_painting", "next_study", "both"],
          },
        }),
        2,
      ),
      type: ["array", "null"],
    },
  });
  const colour = colourAnalysisSchema();
  const visibleSchema = colour.properties.visibleColours as {
    items: { properties: Record<string, unknown> };
    [key: string]: unknown;
  };
  const assessmentSchema = colour.properties.technicalAssessment as {
    properties: Record<string, unknown>;
  };
  const { roleId: _role, ...colourFields } = visibleSchema.items.properties;
  const { insightId: _insight, ...assessmentFields } =
    assessmentSchema.properties;
  const providerColour = {
    ...colour,
    properties: {
      ...colour.properties,
      visibleColours: {
        ...visibleSchema,
        items: object({ ...colourFields, roleIndex }),
      },
      technicalAssessment: {
        ...object({
          ...assessmentFields,
          insightIndex: { type: ["integer", "null"], minimum: 0, maximum: 2 },
        }),
        type: ["object", "null"],
      },
    },
  };
  return {
    ...object({
      title: string(100),
      qualityAssessment: object({
        level: { type: "string", enum: [...qualityLevels] },
        confidence: unit,
        rationale: string(640),
      }),
      visualRoles: {
        ...array(
          object({
            area: string(80),
            role: { type: "string", enum: [...visualRoles] },
            region: { ...rect, type: ["object", "null"] },
            confidence: { ...unit, type: ["number", "null"] },
          }),
          6,
        ),
        type: ["array", "null"],
      },
      compositionStructure: object({
        observation: string(240),
        primary: { $ref: "#/$defs/composition" },
        secondary: { $ref: "#/$defs/composition" },
      }),
      overall: object(block(2, 2)),
      composition: object(block(2, 3)),
      colourValue: object({ ...block(2, 3), colourAnalysis: providerColour }),
      technique: object(block(2, 3)),
      brushPlan: aids.brush,
    }),
    $defs: definitions,
  };
}
