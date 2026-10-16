import { observationText, unsupportedProcess } from "./coachingEvidence.ts";
import {
  conflictsWithDecision,
  type CoachingDecision,
} from "./coachingDecision.ts";
import type { PaintingInsight, PaintingRole } from "./paintingAnalysis.ts";
import {
  approximateMixRatio,
  colourRelationshipText,
} from "./coachingLanguage.ts";

export interface ColourAnalysis {
  visibleColours: {
    label: string;
    approximateHex: string;
    roleId: string | null;
  }[];
  colourStrategy: string;
  valueHierarchy: string;
  chromaHierarchy: string;
  temperatureRelationship: string;
  technicalAssessment: {
    kind: "coherent" | "issue" | "stylistic_alternative" | "uncertain";
    insightId: string | null;
    explanation: string;
  } | null;
  recreationMixes: {
    target: string;
    pigments: string[];
    startingRatio: string | null;
    use: string;
  }[];
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
function safeText(v: unknown, max: number, decision: CoachingDecision): string {
  if (
    typeof v !== "string" ||
    !v.trim() ||
    v.length > max ||
    unsupportedProcess(v) ||
    /\b(?:painted by|the artist is|in the style of)\b|\b(?:you|the user|the artist|the painter|they)\b[^.!?]{0,50}\b(?:expert|professional|skill|experienced)\b/i.test(
      v,
    ) ||
    /\b(?:painted with|(?:original|actual|exact) (?:pigments?|formula|mixture)|the artist used)\b/i.test(
      v,
    ) ||
    conflictsWithDecision(v, decision)
  )
    return "";
  return observationText(v);
}
/** Optional teaching only: malformed colour data never invalidates core facts.
 * Role labels are derived from canonical IDs, never supplied a second time. */
export function cleanColourAnalysis(
  value: unknown,
  roles: PaintingRole[],
  insights: PaintingInsight[],
  decision: CoachingDecision,
): ColourAnalysis | null {
  if (!record(value)) return null;
  const hues = Array.isArray(value.visibleColours)
    ? value.visibleColours.flatMap((c) =>
        record(c) && typeof c.approximateHex === "string"
          ? [c.approximateHex]
          : [],
      )
    : [];
  const text = (v: unknown, max = 180) =>
    colourRelationshipText(safeText(v, max, decision), hues);
  const valueHierarchy = text(value.valueHierarchy);
  if (!valueHierarchy) return null;
  const visibleColours = (
    Array.isArray(value.visibleColours) ? value.visibleColours : []
  )
    .slice(0, 5)
    .flatMap((item) => {
      if (
        !record(item) ||
        !text(item.label, 50) ||
        typeof item.approximateHex !== "string" ||
        !/^#[a-f0-9]{6}$/i.test(item.approximateHex) ||
        (item.roleId !== null && !roles.some((r) => r.id === item.roleId))
      )
        return [];
      return [
        {
          label: text(item.label, 50),
          approximateHex: item.approximateHex,
          roleId: item.roleId as string | null,
        },
      ];
    });
  const raw = value.technicalAssessment;
  let technicalAssessment: ColourAnalysis["technicalAssessment"] = null;
  if (
    record(raw) &&
    ["coherent", "issue", "stylistic_alternative", "uncertain"].includes(
      raw.kind as string,
    ) &&
    text(raw.explanation)
  ) {
    const linked = insights.find(
      (i) => i.id === raw.insightId && i.domain === "colour_value",
    );
    if (
      (raw.insightId === null || linked) &&
      (raw.kind !== "issue" || linked?.classification === "clear_issue") &&
      (raw.kind !== "coherent" ||
        !insights.some(
          (i) =>
            i.domain === "colour_value" && i.classification === "clear_issue",
        ))
    )
      technicalAssessment = {
        kind: raw.kind as NonNullable<
          ColourAnalysis["technicalAssessment"]
        >["kind"],
        insightId: raw.insightId as string | null,
        explanation: text(raw.explanation),
      };
  }
  const recreationMixes = (
    Array.isArray(value.recreationMixes) ? value.recreationMixes : []
  )
    .slice(0, 3)
    .flatMap((item) => {
      if (
        !record(item) ||
        !text(item.target, 50) ||
        !text(item.use, 100) ||
        !Array.isArray(item.pigments) ||
        !item.pigments.length ||
        item.pigments.length > 3 ||
        !item.pigments.every((p) => text(p, 40))
      )
        return [];
      const opaqueVariation =
        /\b(?:opaque|gouache) (?:variation|study|mix|passage|technique)|\b(?:with|using|use) gouache\b/i.test(
          `${item.target} ${item.use}`,
        );
      // Drop the complete optional mix: removing one pigment would leave its
      // supplied ratio/use referring to a different, invented formula.
      if (
        !opaqueVariation &&
        item.pigments.some((p) => /\b(?:white|PW\s*(?:4|6))\b/i.test(p))
      )
        return [];
      return [
        {
          target: text(item.target, 50),
          pigments: item.pigments.map((p) => text(p, 40)),
          startingRatio: approximateMixRatio(item.startingRatio),
          use: text(item.use, 100),
        },
      ];
    });
  return {
    visibleColours,
    colourStrategy: text(value.colourStrategy),
    valueHierarchy,
    chromaHierarchy: text(value.chromaHierarchy),
    temperatureRelationship: text(value.temperatureRelationship),
    technicalAssessment,
    recreationMixes,
  };
}
export function colourAnalysisSchema() {
  const text = (maxLength: number) => ({ type: "string", maxLength });
  const object = (properties: Record<string, unknown>) => ({
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  });
  return {
    ...object({
      visibleColours: {
        type: "array",
        maxItems: 5,
        items: object({
          label: text(50),
          approximateHex: { type: "string", pattern: "^#[a-fA-F0-9]{6}$" },
          roleId: { type: ["string", "null"], maxLength: 40 },
        }),
      },
      colourStrategy: text(180),
      valueHierarchy: text(180),
      chromaHierarchy: text(180),
      temperatureRelationship: text(180),
      technicalAssessment: {
        ...object({
          kind: {
            type: "string",
            enum: ["coherent", "issue", "stylistic_alternative", "uncertain"],
          },
          insightId: { type: ["string", "null"], maxLength: 40 },
          explanation: text(180),
        }),
        type: ["object", "null"],
      },
      recreationMixes: {
        type: "array",
        maxItems: 3,
        items: object({
          target: text(50),
          pigments: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: text(40),
          },
          startingRatio: { type: ["string", "null"], maxLength: 40 },
          use: text(100),
        }),
      },
    }),
    type: ["object", "null"],
  };
}
