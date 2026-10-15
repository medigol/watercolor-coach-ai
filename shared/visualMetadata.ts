import { changeRecommendation, observationText } from "./coachingEvidence.ts";
// Optional image-local teaching metadata. Pure validation only: no I/O or assets.
import {
  validPath,
  validPoint,
  validPolygon,
  validRect,
} from "./imageGeometry.ts";
import type { NormalizedPoint, NormalizedRect } from "./imageGeometry.ts";
export type { NormalizedPoint, NormalizedRect } from "./imageGeometry.ts";

export const feedbackClassifications = [
  "strength",
  "clear_issue",
  "optional_refinement",
  "stylistic_alternative",
  "study_experiment",
] as const;
export const feedbackDomains = [
  "composition",
  "colour_value",
  "technique",
  "overall",
] as const;
export const visualRoles = ["focal", "supporting", "quiet"] as const;
export type FeedbackClassification = (typeof feedbackClassifications)[number];
export type FeedbackDomain = (typeof feedbackDomains)[number];
export type VisualRole = (typeof visualRoles)[number];
export const feedbackScopes = ["local", "multi_region", "global"] as const;
export type FeedbackScope = (typeof feedbackScopes)[number];
export interface VisualNoteMetadata {
  scope?: FeedbackScope | null;
  regions?: NormalizedRect[] | null;
  anchors?: NormalizedPoint[] | null;
  evidence?: string | null;
  region?: NormalizedRect | null;
  regionConfidence?: number | null;
  classification?: FeedbackClassification | null;
  domain?: FeedbackDomain | null;
  relatedDomain?: FeedbackDomain | null;
  visualRole?: VisualRole | null;
}
export const visualMetadataFields = [
  "scope",
  "regions",
  "anchors",
  "evidence",
  "region",
  "regionConfidence",
  "classification",
  "domain",
  "relatedDomain",
  "visualRole",
] as const;
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const confidence = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1;
export function validVisualMetadata(value: unknown): boolean {
  if (!record(value)) return false;
  return (
    (value.scope == null ||
      feedbackScopes.includes(value.scope as FeedbackScope)) &&
    (value.evidence == null || usefulEvidence(value.evidence)) &&
    (value.regions == null ||
      (Array.isArray(value.regions) &&
        value.regions.length <= 3 &&
        value.regions.every(validRect))) &&
    (value.anchors == null ||
      (Array.isArray(value.anchors) &&
        value.anchors.length <= 3 &&
        value.anchors.every(validPoint))) &&
    (value.region == null || validRect(value.region)) &&
    (value.regionConfidence == null || confidence(value.regionConfidence)) &&
    (value.classification == null ||
      feedbackClassifications.includes(
        value.classification as FeedbackClassification,
      )) &&
    (value.domain == null ||
      feedbackDomains.includes(value.domain as FeedbackDomain)) &&
    (value.relatedDomain == null ||
      feedbackDomains.includes(value.relatedDomain as FeedbackDomain)) &&
    (value.visualRole == null ||
      visualRoles.includes(value.visualRole as VisualRole))
  );
}
// Strip bad optional fields independently. Explicitly unavailable regions remain
// null so consumers never guess a crop from unrelated older mark geometry.
export function sanitizeVisualMetadata<T>(value: T): T {
  if (!record(value)) return value;
  const result: Record<string, unknown> = { ...value };
  if (
    result.scope != null &&
    !feedbackScopes.includes(result.scope as FeedbackScope)
  ) {
    delete result.scope;
    result.regionConfidence = 0;
  }
  for (const [field, validator] of [
    ["regions", validRect],
    ["anchors", validPoint],
  ] as const) {
    if (result[field] != null) {
      const values = Array.isArray(result[field])
        ? result[field].slice(0, 32).filter(validator).slice(0, 3)
        : [];
      result[field] = values.length ? values : null;
    }
  }
  if (result.evidence != null && !usefulEvidence(result.evidence))
    delete result.evidence;
  if (result.region != null && !validRect(result.region)) result.region = null;
  if (result.regionConfidence != null && !confidence(result.regionConfidence)) {
    result.regionConfidence = 0;
    if (Object.hasOwn(result, "region")) result.region = null;
    if (Object.hasOwn(result, "regions")) result.regions = null;
    if (Object.hasOwn(result, "anchors")) result.anchors = null;
  }
  for (const [key, allowed] of [
    ["classification", feedbackClassifications],
    ["domain", feedbackDomains],
    ["relatedDomain", feedbackDomains],
    ["visualRole", visualRoles],
  ] as const) {
    if (
      result[key] != null &&
      !(allowed as readonly unknown[]).includes(result[key])
    )
      delete result[key];
  }
  const copy = [result.shortInstruction, result.action]
    .filter((item) => typeof item === "string")
    .join(". ");
  const detected = explicitGuidanceDomain(copy);
  if (
    detected &&
    result.domain &&
    result.domain !== detected &&
    result.domain !== "overall"
  ) {
    result.relatedDomain = result.domain;
    result.domain = detected;
  }
  if (
    result.classification === "strength" &&
    [result.shortInstruction, result.action].some(
      (item) => typeof item === "string" && changeRecommendation(item),
    )
  ) {
    result.classification = "study_experiment";
    result.timing = "next_study";
  }
  if (
    (result.classification === "clear_issue" ||
      result.classification === "optional_refinement") &&
    !usefulEvidence(result.evidence)
  )
    result.classification = "study_experiment";
  if (
    result.classification === "stylistic_alternative" ||
    result.classification === "study_experiment"
  )
    result.timing = "next_study";
  if (result.relatedDomain === result.domain) delete result.relatedDomain;
  return result as T;
}
// Narrow cues identify explicit instructions, not merely visible soft edges or
// colour effects. This is a deterministic metadata guard, not image analysis.
export function explicitGuidanceDomain(value: string): FeedbackDomain | null {
  if (
    /\b(?:crop(?:ping)?|refram(?:e|ing)|reposition|relocate|mov(?:e|ing) (?:the )?(?:house|boat|tree|building|pavilion)|(?:raise|lower|move|change) (?:the )?horizon)\b/i.test(
      value,
    )
  )
    return "composition";
  if (
    /\b(?:wet[- ]on[- ]wet|wet[- ]on[- ]dry|damp[- ]on[- ]damp|damp brush|brush load|load (?:the |your )?brush|(?:rewet|scrub|lift) (?:the |your )?(?:paper|wash|pigment)|(?:wait|paint|work|apply)[^.!?]{0,35}(?:sheen|damp|dry paper)|(?:use|take) (?:a |the )?(?:damp|wet|dry|round|flat|soft) brush)\b/i.test(
      value,
    )
  )
    return "technique";
  if (
    /\b(?:mix|blend)\b[^.!?]{0,55}\b(?:ultramarine|sienna|ochre|blue|yellow|red|neutral|colou?r)\b|\b(?:choose|use|keep|reserve|reduce|increase|limit)\b[^.!?]{0,55}\b(?:chroma|saturation|warm[ /-]cool|palette|temperature|pigments?)\b/i.test(
      value,
    )
  )
    return "colour_value";
  return null;
}

// Missing classifications become cautious study experiments, never invented
// defects. Resolved work can teach success without requiring a negative note.
export function usefulEvidence(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= 12 &&
    value.length <= 250 &&
    !/^(?:this (?:is|looks) (?:weak|wrong|bad|good|nice)|(?:good|bad|nice) (?:composition|colou?r|technique))[.! ]*$/i.test(
      value.trim(),
    )
  );
}
export function effectiveClassification(
  note: VisualNoteMetadata,
  study = false,
): FeedbackClassification {
  const category = note.classification;
  if (
    (category === "clear_issue" || category === "optional_refinement") &&
    !usefulEvidence(note.evidence)
  )
    return "study_experiment";
  if (category && feedbackClassifications.includes(category)) {
    return study && category === "clear_issue"
      ? "optional_refinement"
      : category;
  }
  return "study_experiment";
}

export const compositionArchetypes = [
  "diagonal",
  "s_curve",
  "l_shape",
  "u_frame",
  "enclosure",
  "triangle",
  "radiating",
  "steelyard",
  "balanced_masses",
  "three_spot",
  "rhythm",
  "overlapping_masses",
  "cross",
  "rule_of_thirds",
  "off_centre",
  "none",
  "mixed",
] as const;
export type CompositionArchetype = (typeof compositionArchetypes)[number];
export interface CompositionMass {
  points: NormalizedPoint[];
  role: VisualRole | null;
}
export const compositionTeachingFields = [
  "elements",
  "entry",
  "path",
  "landing",
  "supportingMass",
  "quietMass",
  "counterbalance",
  "risk",
] as const;
export interface CompositionTeaching {
  elements: string[];
  entry: string | null;
  path: string | null;
  landing: string | null;
  supportingMass: string | null;
  quietMass: string | null;
  counterbalance: string | null;
  risk: string | null;
}
export function usableCompositionTeaching(
  value: unknown,
): CompositionTeaching | null {
  if (!record(value)) return null;
  const result: Record<string, unknown> = {
    elements: Array.isArray(value.elements)
      ? value.elements
          .filter(
            (item) =>
              typeof item === "string" && item.trim() && item.length <= 100,
          )
          .slice(0, 3)
      : [],
  };
  for (const field of compositionTeachingFields.slice(1))
    result[field] =
      typeof value[field] === "string" &&
      value[field].trim() &&
      value[field].length <= 180
        ? observationText(value[field]) || null
        : null;
  return (result.elements as string[]).length &&
    [result.entry, result.path, result.landing].some(Boolean)
    ? (result as unknown as CompositionTeaching)
    : null;
}
export interface CompositionOverlay {
  teaching?: CompositionTeaching | null;
  type: CompositionArchetype;
  confidence: number;
  shortExplanation: string;
  paths: NormalizedPoint[][] | null;
  focalPoint: NormalizedPoint | null;
  secondaryPoints: NormalizedPoint[] | null;
  masses: CompositionMass[] | null;
}
const distinct = (points: NormalizedPoint[]) => [
  ...new Map(points.map((point) => [`${point.x},${point.y}`, point])).values(),
];
export function usableCompositionOverlay(
  value: unknown,
): CompositionOverlay | null {
  if (
    !record(value) ||
    !compositionArchetypes.includes(value.type as CompositionArchetype) ||
    !confidence(value.confidence) ||
    typeof value.shortExplanation !== "string" ||
    !value.shortExplanation.trim() ||
    value.shortExplanation.length > 350
  )
    return null;
  const explanation = observationText(value.shortExplanation);
  if (!explanation) return null;
  const paths = Array.isArray(value.paths)
    ? (value.paths
        .slice(0, 16)
        .filter((path) => validPath(path, 2, 12))
        .slice(0, 4) as NormalizedPoint[][])
    : [];
  const secondaryPoints = Array.isArray(value.secondaryPoints)
    ? distinct(value.secondaryPoints.slice(0, 32).filter(validPoint)).slice(
        0,
        6,
      )
    : [];
  const masses: CompositionMass[] = Array.isArray(value.masses)
    ? value.masses
        .slice(0, 16)
        .filter((mass) => record(mass) && validPolygon(mass.points, 12))
        .slice(0, 3)
        .map((mass) => ({
          points: mass.points as NormalizedPoint[],
          role: visualRoles.includes(mass.role as VisualRole)
            ? (mass.role as VisualRole)
            : null,
        }))
    : [];
  return {
    type: value.type as CompositionArchetype,
    confidence: value.confidence,
    shortExplanation: explanation,
    paths: paths.length ? paths : null,
    focalPoint: validPoint(value.focalPoint) ? value.focalPoint : null,
    secondaryPoints: secondaryPoints.length ? secondaryPoints : null,
    masses: masses.length ? masses : null,
    ...(Object.hasOwn(value, "teaching")
      ? { teaching: usableCompositionTeaching(value.teaching) }
      : {}),
  };
}
export function compositionIdentity(value: CompositionOverlay): string {
  const {
    type: _type,
    confidence: _confidence,
    shortExplanation: _explanation,
    teaching: _teaching,
    ...geometry
  } = value;
  return JSON.stringify(geometry);
}
function validCompositionTeaching(value: unknown): boolean {
  if (
    !record(value) ||
    !Array.isArray(value.elements) ||
    value.elements.length > 3 ||
    !usableCompositionTeaching(value)
  )
    return false;
  return (
    Object.keys(value).every((key) =>
      (compositionTeachingFields as readonly string[]).includes(key),
    ) &&
    value.elements.every(
      (item) => typeof item === "string" && !!item.trim() && item.length <= 100,
    ) &&
    compositionTeachingFields
      .slice(1)
      .every(
        (key) =>
          value[key] == null ||
          (typeof value[key] === "string" &&
            (value[key] as string).length <= 180),
      )
  );
}
export function validCompositionOverlay(value: unknown): boolean {
  if (!record(value)) return false;
  const cleaned = usableCompositionOverlay(value);
  if (!cleaned) return false;
  const keys = [
    "type",
    "confidence",
    "shortExplanation",
    "paths",
    "focalPoint",
    "secondaryPoints",
    "masses",
    "teaching",
  ];
  return (
    Object.keys(value).every((key) => keys.includes(key)) &&
    (value.teaching == null || validCompositionTeaching(value.teaching)) &&
    (value.paths == null ||
      (Array.isArray(value.paths) &&
        value.paths.length <= 4 &&
        value.paths.every((path) => validPath(path, 2, 12)))) &&
    (value.focalPoint == null || validPoint(value.focalPoint)) &&
    (value.secondaryPoints == null ||
      (Array.isArray(value.secondaryPoints) &&
        value.secondaryPoints.length <= 6 &&
        value.secondaryPoints.every(validPoint))) &&
    (value.masses == null ||
      (Array.isArray(value.masses) &&
        value.masses.length <= 3 &&
        value.masses.every(
          (mass) =>
            record(mass) &&
            Object.keys(mass).every(
              (key) => key === "points" || key === "role",
            ) &&
            validPolygon(mass.points, 12) &&
            (mass.role == null ||
              visualRoles.includes(mass.role as VisualRole)),
        )))
  );
}
export function drawableCompositionOverlay(
  value: unknown,
): CompositionOverlay | null {
  const overlay = usableCompositionOverlay(value);
  if (!overlay || overlay.confidence < 0.65 || overlay.type === "none")
    return null;
  const anchors = distinct([
    ...(overlay.focalPoint ? [overlay.focalPoint] : []),
    ...(overlay.secondaryPoints ?? []),
  ]);
  const paths = overlay.paths ?? [];
  const masses = overlay.masses ?? [];
  if (overlay.type === "mixed")
    return paths.length || masses.length || anchors.length ? overlay : null;
  if (overlay.type === "rule_of_thirds" || overlay.type === "off_centre")
    return overlay.focalPoint ? overlay : null;
  if (overlay.type === "triangle")
    return validPolygon(anchors, 12) ||
      paths.some((path) => validPolygon(path, 12))
      ? overlay
      : null;
  if (overlay.type === "three_spot")
    return anchors.length >= 3 ? overlay : null;
  if (overlay.type === "steelyard" || overlay.type === "balanced_masses")
    return masses.length >= 2 || anchors.length >= 2 ? overlay : null;
  if (overlay.type === "overlapping_masses")
    return masses.length >= 2 ? overlay : null;
  if (overlay.type === "s_curve" || overlay.type === "l_shape")
    return paths.some((path) => path.length >= 3) ? overlay : null;
  if (overlay.type === "u_frame")
    return paths.some((path) => path.length >= 4) ? overlay : null;
  if (overlay.type === "enclosure")
    return paths.some((path) => validPolygon(path, 12)) ? overlay : null;
  if (overlay.type === "cross") return paths.length >= 2 ? overlay : null;
  if (overlay.type === "radiating") return paths.length >= 2 ? overlay : null;
  if (overlay.type === "rhythm")
    return anchors.length >= 3 || masses.length >= 2 || paths.length >= 2
      ? overlay
      : null;
  return paths.length ? overlay : null;
}

export function classificationLabel(value: FeedbackClassification): string {
  return {
    strength: "Strength",
    clear_issue: "Clear issue",
    optional_refinement: "Optional refinement",
    stylistic_alternative: "Stylistic alternative",
    study_experiment: "Study experiment",
  }[value];
}
export function domainLabel(value: FeedbackDomain): string {
  return {
    composition: "Composition",
    colour_value: "Colour & value",
    technique: "Technique",
    overall: "Overall",
  }[value];
}
