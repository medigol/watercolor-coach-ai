import {
  observationText,
  studyTargetAligned,
} from "../shared/coachingEvidence";
import {
  overlayCategory,
  overlayKind,
  usableOverlays,
  type CoachingOverlay,
} from "./overlays";
import { timingLabel, studyText } from "./coachingPresentation";
import type { ResultProvider } from "./artworks";
import { noteGeometryVisible } from "../shared/imageGeometry";
import { markGeometry } from "./overlayDrawing";

export type ThumbnailKind =
  | "crop"
  | "eye_flow"
  | "big_shapes"
  | "value_mass"
  | "simplification"
  | "horizon"
  | "focal_point"
  | "edge_control";
export type ThumbnailLayout = "landscape" | "street" | "abstract";
export type ThumbnailPlanningInput = {
  overlays?: unknown;
  composition: string;
  sketch: string;
  values: string;
  title?: string;
  uri?: string;
  provider?: ResultProvider;
  study?: boolean;
  focus?: string;
  mainAdvice?: string;
  practice?: string;
};
export type ThumbnailStudy = {
  kind: ThumbnailKind;
  layout: ThumbnailLayout;
  title: string;
  purpose: string;
  action: string;
  timing: string;
  marks: CoachingOverlay[];
};

const studies: Record<
  ThumbnailKind,
  Omit<ThumbnailStudy, "kind" | "layout" | "timing" | "marks">
> = {
  crop: {
    title: "Crop study",
    purpose: "Try this framing before repainting.",
    action:
      "Sketch a smaller frame that quiets a competing area. Keep space around your focal shape, then compare it with the full view.",
  },
  eye_flow: {
    title: "Eye-flow study",
    purpose: "Check whether the viewer’s eye travels naturally.",
    action:
      "Use one shoreline, street edge, or connected shadow to lead toward the focal area. Quiet marks that pull the eye out of the frame.",
  },
  big_shapes: {
    title: "Big-shape plan",
    purpose: "Plan the painting as big shapes first.",
    action:
      "Reduce the subject to three or four large shapes. Leave the light open and save small, sharp marks for one focal area.",
  },
  value_mass: {
    title: "Value mass study",
    purpose: "Group values; do not copy detail.",
    action:
      "Reserve one light group, connect related middle-value shadows, and use a small dark accent to support the focal point.",
  },
  simplification: {
    title: "Simplification study",
    purpose: "Reduce competing detail.",
    action:
      "Replace a busy supporting area with one connected wash. Keep only the few marks that explain the focal shape.",
  },
  horizon: {
    title: "Horizon placement study",
    purpose: "Test the proportion before painting.",
    action:
      "Compare a lower and a higher horizon in tiny studies. Give more space to the light or shape that carries the painting.",
  },
  focal_point: {
    title: "Focal point study",
    purpose: "Give the viewer one clear place to look first.",
    action:
      "Keep the strongest small darks and sharpest edges near the focal area. Let supporting shapes stay quieter.",
  },
  edge_control: {
    title: "Edge handling study",
    purpose: "Compare soft supporting edges with one crisp focal accent.",
    action:
      "On a separate scrap, practise one soft-to-sharp transition. Stop while the supporting wash still feels simple.",
  },
};

const safeText = (value: unknown) =>
  typeof value === "string" ? value.slice(0, 2000) : "";

// Layout cues only choose a reusable worksheet. No source pixels or mark
// coordinates are used, and the diagrams never claim to reproduce a subject.
export function thumbnailLayout(
  input: ThumbnailPlanningInput,
): ThumbnailLayout {
  const text = [input.title, input.composition, input.sketch, input.values]
    .map(safeText)
    .join(" ");
  if (/\b(street|lane|alley|perspective|facade|façade)\b/i.test(text))
    return "street";
  if (
    /\b(beach|landscape|seascape|sea|ocean|shoreline|shore|lake|river|harbour|harbor|horizon)\b/i.test(
      text,
    )
  )
    return "landscape";
  if (/\b(buildings?|town|roofs?|houses?)\b/i.test(text)) return "street";
  return "abstract";
}

// Image studies draw only geometry already supplied with the saved guidance.
// Point-only notes can guide the text, but never become invented boxes or paths.
export function imageStudyMarks(
  kind: ThumbnailKind,
  value: unknown,
): CoachingOverlay[] {
  // Relationship notes remain available in the main coaching view. Thumbnail
  // studies require an actual drawable shape, rather than an inactive marker.
  const notes = usableOverlays(value)
    .filter(
      (note) =>
        noteGeometryVisible(note) &&
        note.scope !== "multi_region" &&
        markGeometry(note, 1, 1).kind !== "point_marker" &&
        studyTargetAligned(
          note.label,
          `${note.shortInstruction}. ${note.reason}. ${note.action}`,
        ),
    )
    .sort(
      (a, b) =>
        ({ high: 3, medium: 2, low: 1 })[b.priority] -
        { high: 3, medium: 2, low: 1 }[a.priority],
    );
  const primary = notes.filter((note) => {
    const geometry = overlayKind(note),
      category = overlayCategory(note);
    if (geometry === "point_marker") return false;
    switch (kind) {
      case "crop":
        return geometry === "crop_box";
      case "eye_flow":
        return (
          geometry === "arrow" ||
          (geometry === "guide_line" &&
            category === "composition" &&
            note.styleHint !== "horizon" &&
            (note.styleHint === "eye_flow" ||
              /\b(eye|path|leading|shoreline|road|street|perspective)\b/i.test(
                `${note.label} ${note.shortInstruction}`,
              )))
        );
      case "value_mass":
        return (
          geometry === "value_mass" ||
          (geometry === "region_highlight" && category === "value_structure")
        );
      case "simplification":
        return (
          ["region_highlight", "value_mass"].includes(geometry) &&
          (category === "simplification" ||
            category === "atmosphere" ||
            note.styleHint === "simplify")
        );
      case "horizon":
        return (
          geometry === "guide_line" &&
          note.styleHint === "horizon" &&
          /\bhorizon\b/i.test(`${note.label}. ${note.action}`)
        );
      case "focal_point":
        return geometry === "focal_ring" && category === "focal_point";
      case "edge_control":
        return geometry === "edge_mark" && category === "edge_control";
      default:
        return false;
    }
  });
  if (!primary.length) return [];
  // One evidence item owns its title, action and geometry. Unrelated focal or
  // quiet companions must not silently change what a study illustrates.
  return primary.slice(0, 1);
}

export function planThumbnailStudies(
  input: ThumbnailPlanningInput,
): ThumbnailStudy[] {
  const layout = thumbnailLayout(input);
  const notes = usableOverlays(input.overlays);
  const text = [
    input.mainAdvice,
    input.practice,
    ...(input.focus === "Composition"
      ? [input.composition]
      : input.focus === "Colour & contrast"
        ? [input.values]
        : input.focus === "Watercolor technique"
          ? []
          : [input.composition, input.values]),
  ]
    .map(safeText)
    .join(" ");
  const candidates = new Map<
    ThumbnailKind,
    { score: number; note?: CoachingOverlay }
  >();
  const hasImage =
    input.provider === "openai" &&
    typeof input.uri === "string" &&
    !!input.uri.trim();
  const geometry = new Map<ThumbnailKind, CoachingOverlay[]>();
  function marksFor(kind: ThumbnailKind) {
    if (!hasImage) return [];
    if (!geometry.has(kind))
      geometry.set(
        kind,
        imageStudyMarks(
          kind,
          notes.filter((note) => {
            if (!note.domain || note.domain === "overall") return true;
            const expected =
              input.focus === "Colour & contrast"
                ? "colour_value"
                : input.focus === "Watercolor technique"
                  ? "technique"
                  : input.focus === "Composition"
                    ? "composition"
                    : null;
            return !expected || note.domain === expected;
          }),
        ),
      );
    return geometry.get(kind)!;
  }
  function consider(
    kind: ThumbnailKind,
    score: number,
    note?: CoachingOverlay,
  ) {
    // A selected focus changes which saved planning geometry is useful, while
    // genuine image-backed studies remain ahead of generic text worksheets.
    const domain = note?.domain;
    if (
      (!input.focus || input.focus === "Overall feedback") &&
      input.mainAdvice
    ) {
      const point = `${input.mainAdvice} ${input.practice ?? ""}`;
      const relevant: Record<ThumbnailKind, RegExp> = {
        crop: /\b(?:crop|fram(?:e|ing))\b/i,
        eye_flow: /\b(?:eye path|eye.flow|leading|direction|diagonal|flow)\b/i,
        big_shapes: /\b(?:shape|mass|balance|simplif\w*)\b/i,
        value_mass: /\b(?:value|light|dark|shadow|contrast)\b/i,
        focal_point:
          /\b(?:focal|attention|focus|centre|center|clearest|light|contrast)\b/i,
        simplification: /\b(?:simplif\w*|detail|quiet|atmosphere)\b/i,
        horizon: /\bhorizon\b/i,
        edge_control: /\b(?:edge|soft|crisp|wash|handling|transparency)\b/i,
      };
      if (!relevant[kind].test(point)) return;
    }

    if (
      note &&
      !/\b(?:test|compare|practi[cs]e|study|exercise|experiment|thumbnail)\b/i.test(
        note.action,
      )
    )
      return;
    const allowed: Record<string, ThumbnailKind[]> = {
      Composition: [
        "crop",
        "eye_flow",
        "big_shapes",
        "simplification",
        "horizon",
        "focal_point",
        "value_mass",
      ],
      "Colour & contrast": ["value_mass", "focal_point"],
      "Watercolor technique": ["edge_control", "simplification"],
    };
    if (
      input.focus &&
      allowed[input.focus] &&
      !allowed[input.focus].includes(kind)
    )
      return;
    if (
      input.focus === "Composition" &&
      domain &&
      !["composition", "overall"].includes(domain)
    )
      return;
    if (
      input.focus === "Colour & contrast" &&
      domain &&
      !["colour_value", "overall"].includes(domain)
    )
      return;
    if (
      input.focus === "Watercolor technique" &&
      domain &&
      !["technique", "overall"].includes(domain)
    )
      return;
    if (
      kind === "horizon" &&
      (!note || !/\bhorizon\b/i.test(`${note.label}. ${note.action}`))
    )
      return;
    if (
      kind === "focal_point" &&
      input.focus === "Colour & contrast" &&
      !/\b(?:value|contrast|temperature|warm|cool|chroma|colou?r)\b/i.test(
        `${note?.reason ?? ""} ${note?.action ?? ""}`,
      )
    )
      return;
    const priorities: Record<string, Partial<Record<ThumbnailKind, number>>> = {
      Composition: { eye_flow: 75, focal_point: 70, crop: 65, horizon: 50 },
      "Colour & contrast": {
        value_mass: 80,
        focal_point: 70,
        simplification: 25,
      },
      "Watercolor technique": {
        edge_control: 85,
        value_mass: 60,
        simplification: 50,
        focal_point: 20,
      },
    };
    const rankedScore =
      score +
      (marksFor(kind).length ? 200 : 0) +
      (priorities[input.focus ?? ""]?.[kind] ?? 0);
    if (rankedScore > (candidates.get(kind)?.score ?? -1))
      candidates.set(kind, { score: rankedScore, note });
  }
  for (const note of notes) {
    const kind = overlayKind(note),
      category = overlayCategory(note);
    const weight = input.focus
      ? note.priority === "high"
        ? 24
        : note.priority === "medium"
          ? 12
          : 0
      : note.priority === "high"
        ? 3
        : note.priority === "medium"
          ? 2
          : 1;
    if (
      kind === "crop_box" ||
      note.type === "composition_crop" ||
      note.styleHint === "crop"
    )
      consider("crop", 100 + weight, note);
    else if (note.styleHint === "horizon")
      consider("horizon", 92 + weight, note);
    else if (
      kind === "arrow" ||
      note.styleHint === "eye_flow" ||
      category === "composition"
    )
      consider("eye_flow", 94 + weight, note);
    if (
      category === "value_structure" ||
      kind === "value_mass" ||
      note.styleHint === "connect_shadow"
    )
      consider("value_mass", 96 + weight, note);
    if (category === "simplification" || note.styleHint === "simplify")
      consider("simplification", 90 + weight, note);
    if (kind === "focal_ring" && category === "focal_point")
      consider("focal_point", 88 + weight, note);
    if (category === "edge_control")
      consider("edge_control", 91 + weight, note);
  }
  // A generic aid earns a place only for an explicit supplied experiment.
  const experiment =
    /\b(?:test|compare|practi[cs]e|experiment|thumbnail)\b/i.test(text);
  if (experiment) {
    if (/\b(?:crop|cropping|framing)\b/i.test(text)) consider("crop", 80);
    if (/\b(?:eye[ -]?(?:flow|path)|leading line)\b/i.test(text))
      consider("eye_flow", 79);
    if (
      /\b(?:value grouping|value study|light.middle.dark|connected shadows?)\b/i.test(
        text,
      )
    )
      consider("value_mass", 70);
    if (/\b(?:edge|wash|glazing|transparency|dry.brush)\b/i.test(text))
      consider("edge_control", 73);
  }
  const ranked = [...candidates.entries()].sort(
    (a, b) => b[1].score - a[1].score,
  );
  return ranked.slice(0, 2).map(([kind, candidate]) => {
    const marks = marksFor(kind);
    const source = marks[0] ?? candidate.note;
    return {
      kind,
      layout,
      ...studies[kind],
      ...(input.focus === "Watercolor technique" && !source
        ? { title: "Handling study" }
        : {}),
      ...(source ? { title: `${studies[kind].title} · ${source.label}` } : {}),
      ...(kind === "horizon" && marks.length
        ? { title: "Horizon / structure study" }
        : {}),
      purpose: input.study
        ? studyText(
            source?.reason,
            "Compare this planning idea with the wider composition.",
          )
        : (source?.reason ??
          (observationText(input.mainAdvice) || studies[kind].purpose)),
      action: input.study
        ? studyText(
            source?.action,
            "If useful, test one small variation on a separate sheet.",
          )
        : (source?.action ??
          (observationText(input.practice) || studies[kind].action)),
      timing: input.study
        ? "Optional next study variation"
        : kind === "crop"
          ? "Try this crop in the next study"
          : kind === "horizon" && !marks.length
            ? "Try in the next study"
            : source
              ? timingLabel(source)
              : "Test in a small study first",
      marks,
    };
  });
}
