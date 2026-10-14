import {
  overlayCategory,
  overlayKind,
  usableOverlays,
  type CoachingOverlay,
} from "./overlays";

export type ThumbnailKind =
  | "crop"
  | "eye_flow"
  | "big_shapes"
  | "value_mass"
  | "simplification"
  | "horizon";
export type ThumbnailLayout = "landscape" | "street" | "abstract";
export type ThumbnailPlanningInput = {
  overlays?: unknown;
  composition: string;
  sketch: string;
  values: string;
  title?: string;
};
export type ThumbnailStudy = {
  kind: ThumbnailKind;
  layout: ThumbnailLayout;
  title: string;
  purpose: string;
  action: string;
};

const studies: Record<
  ThumbnailKind,
  Omit<ThumbnailStudy, "kind" | "layout">
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

export function planThumbnailStudies(
  input: ThumbnailPlanningInput,
): ThumbnailStudy[] {
  const layout = thumbnailLayout(input);
  const notes = usableOverlays(input.overlays);
  const text = [input.composition, input.sketch, input.values]
    .map(safeText)
    .join(" ");
  const candidates = new Map<
    ThumbnailKind,
    { score: number; note?: CoachingOverlay }
  >();
  function consider(
    kind: ThumbnailKind,
    score: number,
    note?: CoachingOverlay,
  ) {
    if (score > (candidates.get(kind)?.score ?? -1))
      candidates.set(kind, { score, note });
  }
  consider("big_shapes", 10);
  consider("value_mass", 9);
  for (const note of notes) {
    const kind = overlayKind(note),
      category = overlayCategory(note);
    const weight =
      note.priority === "high" ? 3 : note.priority === "medium" ? 2 : 1;
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
  }
  if (/\b(crop|cropping|framing)\b/i.test(text)) consider("crop", 80);
  if (
    /\b(eye[ -]?(flow|path)|lead(?:s|ing)?\s+(?:the\s+)?eye|leading line|street perspective)\b/i.test(
      text,
    )
  )
    consider("eye_flow", 79);
  if (/\b(value|values|shadows?|light|middle|dark)\b/i.test(text))
    consider("value_mass", 70);
  if (
    /\b(simplif\w*|reduce\s+(?:competing\s+)?detail|quiet\s+(?:the\s+)?background|one\s+(?:connected\s+)?wash)\b/i.test(
      text,
    )
  )
    consider("simplification", 68);
  if (
    layout === "landscape" &&
    /\b(horizon|sky\/ground|sky and (?:ground|water)|shoreline)\b/i.test(text)
  )
    consider("horizon", 76);
  const ranked = [...candidates.entries()].sort(
    (a, b) => b[1].score - a[1].score,
  );
  const count =
    ranked.filter(([, item]) => item.score >= 50).length >= 3 ? 3 : 2;
  return ranked.slice(0, count).map(([kind, candidate]) => ({
    kind,
    layout,
    ...studies[kind],
    action: candidate.note?.action ?? studies[kind].action,
  }));
}
