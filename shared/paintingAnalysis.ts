import {
  compositionIdentity,
  feedbackClassifications,
  feedbackDomains,
  usableCompositionOverlay,
  visualRoles,
  type CompositionOverlay,
  type FeedbackClassification,
  type FeedbackDomain,
  type VisualRole,
} from "./visualMetadata.ts";
import { validRect, type NormalizedRect } from "./imageGeometry.ts";
import {
  changeRecommendation,
  conflictsWithStrength,
  observationText,
  sameLearningInsight,
} from "./coachingEvidence.ts";
import { coherentFeedback, type CoachingDecision } from "./coachingDecision.ts";

// A saved, versioned document; no I/O and no inferred geometry or extra analysis.
export const expertViewKeys = [
  "overall",
  "composition",
  "colourValue",
  "technique",
] as const;
export type ExpertViewKey = (typeof expertViewKeys)[number];
export const qualityLevels = [
  "developing",
  "competent",
  "strong",
  "highly_resolved",
] as const;
export const expertViewLabels: Record<ExpertViewKey, string> = {
  overall: "Overall",
  composition: "Composition",
  colourValue: "Colour & value",
  technique: "Watercolor technique",
};
export const expertViewFocus: Record<ExpertViewKey, string> = {
  overall: "Overall feedback",
  composition: "Composition",
  colourValue: "Colour & contrast",
  technique: "Watercolor technique",
};
const domains: Record<ExpertViewKey, FeedbackDomain> = {
  overall: "overall",
  composition: "composition",
  colourValue: "colour_value",
  technique: "technique",
};
export function initialExpertView(focus: unknown): ExpertViewKey {
  return (
    expertViewKeys.find((key) => expertViewFocus[key] === focus) ?? "overall"
  );
}
export interface PaintingRole {
  id: string;
  area: string;
  role: VisualRole;
  region: NormalizedRect | null;
  confidence: number | null;
}
export interface PaintingFact {
  id: string;
  domain: FeedbackDomain;
  observation: string;
  roleId: string | null;
}
export interface PaintingInsight {
  id: string;
  domain: FeedbackDomain;
  classification: FeedbackClassification;
  factIds: string[];
  lesson: string;
  action: string;
}
export interface ExpertView {
  summaryId: string;
  insightIds: string[];
  practice: string;
}
export interface PracticeBrush {
  stage: string;
  brush: string;
  wash: string;
  technique: "wet_on_wet" | "wet_on_dry" | "damp_on_damp";
  timing: string;
  edges: string;
  stop: string;
}
export interface PaintingAnalysisResult {
  title: string;
  canonicalAnalysis: {
    version: 1;
    qualityAssessment: {
      level: (typeof qualityLevels)[number];
      confidence: number;
      rationale: string;
    };
    visualRoles: PaintingRole[];
    facts: PaintingFact[];
    composition: {
      observation: string;
      primary: CompositionOverlay | null;
      secondary: CompositionOverlay | null;
    };
    insights: PaintingInsight[];
    visualEvidence?: {
      insightId: string;
      roleId: string | null;
      note: Record<string, unknown>;
    }[];
    palette?: { name: string; hex: string; use: string }[] | null;
    brushPlan?: PracticeBrush[] | null;
  };
  expertViews: Record<ExpertViewKey, ExpertView>;
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 240): v is string =>
  typeof v === "string" && !!v.trim() && v.length <= max;
const unit = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
const id = (v: unknown): v is string =>
  typeof v === "string" && /^[a-zA-Z0-9_-]{1,40}$/.test(v);
const keys = (
  v: Record<string, unknown>,
  required: string[],
  optional: string[] = [],
) =>
  required.every((key) => Object.hasOwn(v, key)) &&
  Object.keys(v).every((key) => [...required, ...optional].includes(key));
const list = (v: unknown, min: number, max: number): v is unknown[] =>
  Array.isArray(v) && v.length >= min && v.length <= max;
const distinct = (values: unknown[]) => new Set(values).size === values.length;
const personAssessment = (value: string) =>
  /\b(?:you|the user|the artist|the painter|they)\b[^.!?]{0,50}\b(?:expert|professional|skill|years|experienced)\b|\b(?:expert|professional|experienced) (?:painter|artist)\b/i.test(
    value,
  );
export function hasPaintingAnalysis(value: unknown): boolean {
  return (
    record(value) &&
    (Object.hasOwn(value, "canonicalAnalysis") ||
      Object.hasOwn(value, "expertViews"))
  );
}

/** Required facts/views cannot be repaired into a successful paid result. Optional
 * geometry/aids are cleaned separately, never fabricated from legacy prose. */
export function validPaintingAnalysis(
  value: unknown,
): value is PaintingAnalysisResult {
  if (
    !record(value) ||
    !keys(value, ["title", "canonicalAnalysis", "expertViews"]) ||
    !text(value.title, 100)
  )
    return false;
  const c = value.canonicalAnalysis,
    views = value.expertViews;
  if (
    !record(c) ||
    c.version !== 1 ||
    !keys(
      c,
      [
        "version",
        "qualityAssessment",
        "visualRoles",
        "facts",
        "composition",
        "insights",
      ],
      ["visualEvidence", "palette", "brushPlan"],
    ) ||
    !record(views) ||
    !keys(views, [...expertViewKeys])
  )
    return false;
  const q = c.qualityAssessment;
  if (
    !record(q) ||
    !keys(q, ["level", "confidence", "rationale"]) ||
    !qualityLevels.includes(q.level as never) ||
    !unit(q.confidence) ||
    !text(q.rationale) ||
    personAssessment(q.rationale)
  )
    return false;
  if (
    !list(c.visualRoles, 0, 6) ||
    !c.visualRoles.every(
      (r) =>
        record(r) &&
        keys(r, ["id", "area", "role", "region", "confidence"]) &&
        id(r.id) &&
        text(r.area, 80) &&
        visualRoles.includes(r.role as never) &&
        // Region/confidence are optional visualization data, cleaned below.
        Object.hasOwn(r, "confidence"),
    )
  )
    return false;
  const roles = c.visualRoles as unknown as PaintingRole[];
  if (
    !distinct(roles.map((r) => r.id)) ||
    !distinct(roles.map((r) => r.area.trim().toLowerCase())) ||
    roles.filter((r) => r.role === "focal").length > 1
  )
    return false;
  const roleIds = new Set(roles.map((r) => r.id));
  if (
    !list(c.facts, 1, 8) ||
    !c.facts.every(
      (f) =>
        record(f) &&
        keys(f, ["id", "domain", "observation", "roleId"]) &&
        id(f.id) &&
        feedbackDomains.includes(f.domain as never) &&
        text(f.observation) &&
        (f.roleId === null || roleIds.has(f.roleId as string)),
    )
  )
    return false;
  const facts = c.facts as unknown as PaintingFact[],
    factIds = new Set(facts.map((f) => f.id));
  if (factIds.size !== facts.length) return false;
  if (
    !record(c.composition) ||
    !keys(c.composition, ["observation", "primary", "secondary"]) ||
    !text(c.composition.observation)
  )
    return false;
  if (
    !list(c.insights, 4, 12) ||
    !c.insights.every(
      (i) =>
        record(i) &&
        keys(i, [
          "id",
          "domain",
          "classification",
          "factIds",
          "lesson",
          "action",
        ]) &&
        id(i.id) &&
        feedbackDomains.includes(i.domain as never) &&
        feedbackClassifications.includes(i.classification as never) &&
        list(i.factIds, 1, 3) &&
        distinct(i.factIds) &&
        i.factIds.every((f) => factIds.has(f as string)) &&
        text(i.lesson) &&
        text(i.action, 180),
    )
  )
    return false;
  const insights = c.insights as unknown as PaintingInsight[];
  if (!distinct(insights.map((i) => i.id))) return false;
  if (
    insights.some((insight, index) =>
      insights
        .slice(0, index)
        .some(
          (previous) =>
            previous.domain !== insight.domain &&
            previous.lesson.trim().toLowerCase() ===
              insight.lesson.trim().toLowerCase(),
        ),
    )
  )
    return false;
  for (const key of expertViewKeys) {
    const v = views[key];
    if (
      !record(v) ||
      !keys(v, ["summaryId", "insightIds", "practice"]) ||
      !id(v.summaryId) ||
      !text(v.practice, 240) ||
      !list(v.insightIds, 1, key === "overall" ? 2 : 3) ||
      !distinct(v.insightIds) ||
      !v.insightIds.includes(v.summaryId)
    )
      return false;
    if (
      !v.insightIds.every((ref) =>
        insights.some((i) => i.id === ref && i.domain === domains[key]),
      )
    )
      return false;
  }
  return insights.some((i) => i.classification === "strength");
}

export type NoteCleaner = (value: unknown) => unknown[];
const derivedNoteFields = [
  "visualRole",
  "classification",
  "domain",
  "evidence",
  "reason",
  "action",
];
function evidenceNote(
  c: PaintingAnalysisResult["canonicalAnalysis"],
  item: {
    insightId: string;
    roleId: string | null;
    note: Record<string, unknown>;
  },
) {
  const insight = c.insights.find((insight) => insight.id === item.insightId);
  if (!insight) return null;
  const facts = insight.factIds.map(
    (id) => c.facts.find((fact) => fact.id === id)!,
  );
  const fact =
    item.roleId === null
      ? facts[0]
      : facts.find((fact) => fact.roleId === item.roleId);
  if (!fact) return null;
  return {
    ...item.note,
    visualRole:
      c.visualRoles.find((role) => role.id === item.roleId)?.role ?? null,
    classification: insight.classification,
    domain: insight.domain,
    evidence: fact.observation,
    reason: insight.lesson,
    action: insight.action,
  };
}
/** Restrained frontend-controlled geometry over canonical normalized anchors.
 * No independent view can supply or change it. Existing renderer handles grids,
 * curves and archetype-specific masses from this one shared object. */
function canonicalStructure(value: unknown): CompositionOverlay | null {
  const overlay = usableCompositionOverlay(value);
  if (!overlay) return null;
  if (overlay.type === "diagonal" && overlay.paths?.[0]) {
    const path = overlay.paths[0];
    overlay.paths = [[path[0], path[path.length - 1]]];
  }
  return overlay;
}
function roleDecision(
  c: PaintingAnalysisResult["canonicalAnalysis"],
): CoachingDecision {
  return {
    // A compatibility guard, never an expert view's proposed change. Keeping
    // this invariant prevents legacy priority reconciliation from moving roles.
    primaryGoal: "Preserve the painting's established hierarchy.",
    primarySubjectOrArea:
      c.visualRoles.find((r) => r.role === "focal")?.area ?? "painting",
    areasToEmphasize: c.visualRoles
      .filter((r) => r.role === "focal")
      .map((r) => r.area),
    areasToQuiet: c.visualRoles
      .filter((r) => r.role !== "focal")
      .map((r) => r.area)
      .slice(0, 3),
    visualRoles: c.visualRoles.map((r) => ({ area: r.area, role: r.role })),
    currentPaintingAction: null,
    nextStudyAction: null,
    supportingObservations: c.facts.map((f) => f.observation).slice(0, 3),
    compositionImplication: null,
    colourImplication: null,
    techniqueImplication: null,
  };
}
/** Invalid required content stays invalid. Callers MUST check validPaintingAnalysis
 * after cleaning. Optional failures never turn a malformed core into a sample. */
export function cleanPaintingAnalysis(
  value: unknown,
  cleanNotes: NoteCleaner,
): unknown {
  if (!validPaintingAnalysis(value)) return value;
  const c = value.canonicalAnalysis;
  const facts = c.facts.map((f) => ({
    ...f,
    observation: observationText(f.observation),
  }));
  if (facts.some((f) => !f.observation)) return null;
  const quality = {
    ...c.qualityAssessment,
    rationale: observationText(c.qualityAssessment.rationale),
  };
  if (!quality.rationale) return null;
  const strengths = c.insights
    .filter((i) => i.classification === "strength")
    .map((i) =>
      [
        ...i.factIds.map((ref) => facts.find((f) => f.id === ref)!.observation),
        observationText(i.lesson),
      ].join(" "),
    );
  const decision = roleDecision(c);
  const insights = c.insights.map((i) => {
    const lesson = observationText(i.lesson),
      action = observationText(i.action);
    let classification = i.classification;
    if (
      classification === "strength" &&
      (changeRecommendation(action) ||
        (changeRecommendation(lesson) &&
          /^(?:enhance|deepen|increase|reduce|sharpen|soften|strengthen|darken|lighten|simplify|mute|quiet|add)\b|\b(?:should|needs?|could)\b/i.test(
            lesson,
          )))
    )
      classification = "study_experiment";
    // A recommendation conflicting with successful evidence is an alternative
    // study, never a newly invented defect or intervention on the original.
    const contradiction = conflictsWithStrength(
      `${lesson}. ${action}`,
      strengths,
    );
    if (contradiction) classification = "study_experiment";
    const guarded = coherentFeedback(
      {
        mainAdvice: lesson,
        whatWorks: [],
        whatToFix: [action],
        coachingDecision: decision,
      },
      "improve_painting",
    );
    const roleConflict =
      guarded.whatToFix.length === 0 || guarded.mainAdvice !== lesson;
    if (roleConflict) classification = "study_experiment";
    const safeAction =
      contradiction || roleConflict
        ? "In a separate study, compare this alternative while preserving the original focal hierarchy."
        : action;
    // Clear issues need directly referenced visible evidence, not bare taste.
    if (
      classification === "clear_issue" &&
      !i.factIds.some((ref) =>
        /\b(?:competes?|obscures?|unreadable|confus\w*|disrupt\w*|flattens?|unintended|dominates?|muddy|harms?|weakens?)\b/i.test(
          facts.find((f) => f.id === ref)!.observation,
        ),
      )
    )
      classification = "optional_refinement";
    return { ...i, lesson, action: safeAction, classification };
  });
  if (insights.some((i) => !i.lesson || !i.action)) return null;
  const roles = c.visualRoles.map((r) => ({
    ...r,
    region: validRect(r.region) ? r.region : null,
    confidence: unit(r.confidence) ? r.confidence : null,
  }));
  const rawPrimary = usableCompositionOverlay(c.composition.primary),
    rawSecondary = usableCompositionOverlay(c.composition.secondary);
  const focal = roles.find(
    (role) =>
      role.role === "focal" && role.region && (role.confidence ?? 0) >= 0.65,
  );
  const matchesFocal = (overlay: CompositionOverlay | null) => {
    if (!overlay?.focalPoint || !focal?.region) return true;
    const point = overlay.focalPoint,
      region = focal.region;
    return (
      point.x >= region.x &&
      point.x <= region.x + region.width &&
      point.y >= region.y &&
      point.y <= region.y + region.height
    );
  };
  const candidatePrimary = canonicalStructure(c.composition.primary);
  const primary = matchesFocal(candidatePrimary) ? candidatePrimary : null;
  let secondary =
    rawPrimary &&
    rawSecondary &&
    compositionIdentity(rawPrimary) === compositionIdentity(rawSecondary)
      ? null
      : canonicalStructure(c.composition.secondary);
  if (
    !primary ||
    !matchesFocal(secondary) ||
    (secondary &&
      compositionIdentity(primary) === compositionIdentity(secondary))
  )
    secondary = null;
  const visualEvidence = (
    Array.isArray(c.visualEvidence) ? c.visualEvidence : []
  )
    .slice(0, 6)
    .flatMap((item) => {
      if (
        !record(item) ||
        !record(item.note) ||
        (item.roleId !== null && !roles.some((r) => r.id === item.roleId))
      )
        return [];
      const role = roles.find((r) => r.id === item.roleId);
      if (
        role?.region &&
        (role.confidence ?? 0) >= 0.65 &&
        item.note.scope === "local" &&
        validRect(item.note.region)
      ) {
        const a = role.region,
          b = item.note.region;
        if (
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y
        )
          return [];
      }
      const derived = evidenceNote(
        { ...c, facts, insights, visualRoles: roles },
        item,
      );
      if (!derived) return [];
      const notes = coherentFeedback(
        { overlays: cleanNotes([derived]), coachingDecision: decision },
        "improve_painting",
      ).overlays;
      return notes.flatMap((note) => {
        if (!record(note) || note.classification !== derived.classification)
          return [];
        const stored = Object.fromEntries(
          Object.entries(note).filter(
            ([key]) => !derivedNoteFields.includes(key),
          ),
        );
        return [
          {
            insightId: item.insightId,
            roleId: item.roleId as string | null,
            note: stored,
          },
        ];
      });
    })
    .slice(0, 3);
  const palette = Array.isArray(c.palette)
    ? c.palette
        .slice(0, 4)
        .filter(
          (p) =>
            record(p) &&
            text(p.name, 60) &&
            typeof p.hex === "string" &&
            /^#[0-9a-f]{6}$/i.test(p.hex) &&
            text(p.use, 180),
        )
        .map((p) => ({ name: p.name, hex: p.hex, use: p.use }))
    : null;
  const brushFields = [
    "stage",
    "brush",
    "wash",
    "technique",
    "timing",
    "edges",
    "stop",
  ];
  const brushPlan = Array.isArray(c.brushPlan)
    ? c.brushPlan
        .slice(0, 2)
        .map((stage) =>
          record(stage)
            ? Object.fromEntries(
                Object.entries(stage).map(([key, value]) => [
                  key,
                  key === "technique" ? value : observationText(value),
                ]),
              )
            : stage,
        )
        .filter(
          (b) =>
            record(b) &&
            keys(b, brushFields) &&
            ["wet_on_wet", "wet_on_dry", "damp_on_damp"].includes(
              b.technique as string,
            ) &&
            brushFields
              .filter((k) => k !== "technique")
              .every((k) => text(b[k], k === "stage" ? 60 : 120)),
        )
    : null;
  const views = Object.fromEntries(
    expertViewKeys.map((key) => [
      key,
      {
        ...value.expertViews[key],
        practice: observationText(value.expertViews[key].practice),
      },
    ]),
  );
  return {
    ...value,
    canonicalAnalysis: {
      ...c,
      qualityAssessment: quality,
      facts,
      insights,
      visualRoles: roles,
      composition: {
        observation: observationText(c.composition.observation),
        primary,
        secondary,
      },
      visualEvidence,
      palette: palette?.length ? palette : null,
      brushPlan: brushPlan?.length ? brushPlan : null,
    },
    expertViews: views,
  };
}

/** Existing display components receive a local projection. It is never persisted
 * and never acquires view-specific geometry, roles or assessment. */
export function projectPaintingAnalysis(
  value: PaintingAnalysisResult,
  key: ExpertViewKey,
) {
  const c = value.canonicalAnalysis,
    v = value.expertViews[key];
  const selected = v.insightIds.map(
    (id) => c.insights.find((i) => i.id === id)!,
  );
  const summary = selected.find((i) => i.id === v.summaryId)!;
  const strengthText = (i: PaintingInsight) =>
    `${i.factIds.map((ref) => c.facts.find((f) => f.id === ref)!.observation).join(" ")} ${i.id === summary.id ? i.action : `${i.lesson} ${i.action}`}`;
  const works = selected.filter((i) => i.classification === "strength");
  const decision = roleDecision(c);
  const strong = ["strong", "highly_resolved"].includes(
    c.qualityAssessment.level,
  );
  const clear = c.insights.filter((i) => i.classification === "clear_issue");
  const projected = {
    title: value.title,
    mainAdvice: ["strength", "clear_issue"].includes(summary.classification)
      ? summary.lesson
      : `Optional separate study: ${summary.lesson}`,
    whatWorks: (works.length
      ? works
      : c.insights.filter((i) => i.classification === "strength").slice(0, 1)
    ).map(strengthText),
    whatToFix: selected
      .filter((i) => i.classification === "clear_issue")
      .map((i) => `${i.lesson} ${i.action}`),
    composition: c.composition.observation,
    sketch: "",
    values: c.facts
      .filter((f) => f.domain === "colour_value")
      .map((f) => f.observation)
      .join(" "),
    practice: v.practice,
    prompt: "",
    coachingMode:
      strong && !clear.length ? ("study" as const) : ("constructive" as const),
    coachingDecision: decision,
    compositionOverlay: c.composition.primary,
    secondaryCompositionOverlay: c.composition.secondary,
    overlays: (c.visualEvidence ?? [])
      .map((item) => evidenceNote(c, item))
      .filter((note): note is NonNullable<typeof note> => !!note),
    palette: c.palette,
    brushPlan: c.brushPlan,
  };
  return coherentFeedback(projected, "improve_painting");
}
export function optionalViewInsights(
  value: PaintingAnalysisResult,
  key: ExpertViewKey,
): PaintingInsight[] {
  const view = value.expertViews[key];
  return value.canonicalAnalysis.insights.filter(
    (i) =>
      view.insightIds.includes(i.id) &&
      i.id !== view.summaryId &&
      !sameLearningInsight(
        i.lesson,
        value.canonicalAnalysis.insights.find(
          (insight) => insight.id === view.summaryId,
        )!.lesson,
      ) &&
      !["strength", "clear_issue"].includes(i.classification),
  );
}

// Build using the existing optional-note/structure schemas. Strict JSON output
// includes nullable aids; saved documents may omit failed optional aids.
export function paintingAnalysisSchema(aids: {
  overlay: unknown;
  structure: unknown;
  brush: unknown;
}) {
  const string = (maxLength: number) => ({
    type: "string",
    minLength: 1,
    maxLength,
  });
  const object = (properties: Record<string, unknown>) => ({
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  });
  const array = (items: unknown, maxItems: number, minItems = 0) => ({
    type: "array",
    items,
    minItems,
    maxItems,
  });
  const unit = { type: "number", minimum: 0, maximum: 1 };
  const nullableString = { type: ["string", "null"], maxLength: 40 };
  const rect = {
    ...object({ x: unit, y: unit, width: unit, height: unit }),
    type: ["object", "null"],
  };
  const insight = object({
    id: string(40),
    domain: { type: "string", enum: [...feedbackDomains] },
    classification: { type: "string", enum: [...feedbackClassifications] },
    factIds: array(string(40), 3, 1),
    lesson: string(240),
    action: string(180),
  });
  const view = (max: number) =>
    object({
      summaryId: string(40),
      insightIds: array(string(40), max, 1),
      practice: string(240),
    });
  return object({
    title: string(100),
    canonicalAnalysis: object({
      version: { type: "integer", enum: [1] },
      qualityAssessment: object({
        level: { type: "string", enum: [...qualityLevels] },
        confidence: unit,
        rationale: string(240),
      }),
      visualRoles: array(
        object({
          id: string(40),
          area: string(80),
          role: { type: "string", enum: [...visualRoles] },
          region: rect,
          confidence: { ...unit, type: ["number", "null"] },
        }),
        6,
      ),
      facts: array(
        object({
          id: string(40),
          domain: { type: "string", enum: [...feedbackDomains] },
          observation: string(240),
          roleId: nullableString,
        }),
        8,
        1,
      ),
      composition: object({
        observation: string(240),
        primary: aids.structure,
        secondary: aids.structure,
      }),
      insights: array(insight, 12, 4),
      visualEvidence: {
        ...array(
          object({
            insightId: string(40),
            roleId: nullableString,
            note: aids.overlay,
          }),
          3,
        ),
        type: ["array", "null"],
      },
      palette: {
        ...array(
          object({
            name: string(60),
            hex: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
            use: string(180),
          }),
          4,
        ),
        type: ["array", "null"],
      },
      brushPlan: aids.brush,
    }),
    expertViews: object({
      overall: view(2),
      composition: view(3),
      colourValue: view(3),
      technique: view(3),
    }),
  });
}
