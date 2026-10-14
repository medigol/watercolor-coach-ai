import {
  overlayCategory,
  overlayKind,
  usableOverlays,
  type CoachingOverlay,
} from "./overlays";

export const compositionModelIds = [
  "s_curve",
  "diagonal",
  "l_foreground",
  "high_horizon",
  "low_horizon",
  "dominant_foreground",
  "off_center",
  "triangle",
  "frame_in_frame",
  "big_light_dark",
  "connected_shadow",
  "quiet_background",
  "lead_in",
  "supporting_masses",
  "big_shapes",
] as const;
export type CompositionModelId = (typeof compositionModelIds)[number];
export type CompositionModelsInput = {
  overlays?: unknown;
  composition: string;
  values: string;
  title?: string;
};
export type CompositionModel = {
  id: CompositionModelId;
  name: string;
  whenToUse: string;
  application: string;
  action: string;
  description: string;
};

export const compositionModelLibrary: Record<
  CompositionModelId,
  Omit<CompositionModel, "id">
> = {
  s_curve: {
    name: "S-curve eye path",
    whenToUse: "When a winding shoreline, road, or shadow can lead the eye.",
    application:
      "Let one connected route guide the viewer toward a quiet focal area.",
    action:
      "Draw one gentle S in a small study; reduce marks that pull away from that route.",
    description:
      "A curved path moves through quiet masses toward a small focal area.",
  },
  diagonal: {
    name: "Diagonal movement",
    whenToUse:
      "When a slope, street, or light shape can give the painting direction.",
    application:
      "Compare one clear diagonal with the quieter supporting shapes.",
    action:
      "Test one main diagonal in a thumbnail and keep other directions less emphatic.",
    description: "One diagonal mass leads upward toward a focal accent.",
  },
  l_foreground: {
    name: "L-shaped foreground",
    whenToUse:
      "When a foreground bank or upright shape can anchor an open view.",
    application:
      "A joined horizontal and upright mass can support the lighter space.",
    action:
      "Join the foreground and side shape in a small study; leave the central light open.",
    description:
      "An L-shaped supporting mass surrounds open light and a focal group.",
  },
  high_horizon: {
    name: "High horizon",
    whenToUse:
      "When foreground shapes and connected shadows carry the painting.",
    application:
      "Give the ground more space while keeping the distant band quiet.",
    action:
      "Try a higher horizon in the next study and group the larger foreground into a few washes.",
    description:
      "A high horizon leaves a large foreground with one focal accent.",
  },
  low_horizon: {
    name: "Low horizon",
    whenToUse: "When sky, atmosphere, or a large light area should dominate.",
    application:
      "Give the sky more space and simplify the smaller ground band.",
    action:
      "Try a lower horizon in the next study; keep the sky wash broad and the ground marks selective.",
    description:
      "A low horizon preserves a large open sky over a narrow ground band.",
  },
  dominant_foreground: {
    name: "Dominant foreground mass",
    whenToUse:
      "When a strong near shape can support a smaller distant subject.",
    application:
      "Balance one broad foreground wash against a small focal accent.",
    action:
      "Test the foreground as one connected shape; leave a light opening toward the focal area.",
    description:
      "A broad foreground mass supports a small focal area and an open light gap.",
  },
  off_center: {
    name: "Off-centre focal point",
    whenToUse:
      "When figures or a building should carry the painting without feeling centred.",
    application:
      "Compare an off-centre focal group with quiet space around it.",
    action:
      "In the next small study, test the focal group away from the centre and keep the strongest contrast there.",
    description:
      "A small focal group sits off-centre with quiet supporting masses.",
  },
  triangle: {
    name: "Triangle grouping",
    whenToUse: "When three unequal shapes need a calm, connected arrangement.",
    application:
      "Let one leading shape and two supporting masses make a loose triangle.",
    action:
      "Sketch three unequal masses; keep one stronger and leave breathing space between them.",
    description:
      "Three unequal masses form a loose triangular group with one leading accent.",
  },
  frame_in_frame: {
    name: "Frame within a frame",
    whenToUse:
      "When an opening, doorway, or side shapes can frame the main light.",
    application:
      "Use surrounding masses to support the view through the lighter opening.",
    action:
      "Test the surrounding shapes as one quiet frame; reserve detail for the opening and focal area.",
    description:
      "A quiet outer mass frames an open interior and a small focal accent.",
  },
  big_light_dark: {
    name: "Big light, small dark",
    whenToUse: "When one clean light shape should carry the painting.",
    application:
      "Keep a generous light area and support it with a small dark accent.",
    action:
      "Reserve the largest light shape in your study; add just one small, well-placed dark accent.",
    description: "A broad light shape contains one small dark focal accent.",
  },
  connected_shadow: {
    name: "Connected shadow mass",
    whenToUse: "When scattered darks make a supporting area feel busy.",
    application:
      "Compare one connected value group with many separate dark marks.",
    action:
      "Join related shadow shapes in your thumbnail and save the darkest small marks for the focal area.",
    description:
      "Related shadow shapes form one connected mass with a small stronger focal accent.",
  },
  quiet_background: {
    name: "Quiet background, sharp focus",
    whenToUse: "When background detail competes with the main subject.",
    application:
      "Let soft supporting masses make the sharper focal marks easier to read.",
    action:
      "Test a quieter background wash and reserve the cleanest edges for the focal group.",
    description:
      "A pale grouped background supports a small crisp focal shape.",
  },
  lead_in: {
    name: "Shoreline or road lead-in",
    whenToUse: "When a road, shoreline, or perspective edge can guide the eye.",
    application:
      "Connect the foreground direction to a small focal group in the distance.",
    action:
      "Use one clear leading path in your study; quiet nearby edges that compete with it.",
    description:
      "Two quiet leading edges converge toward a distant focal group.",
  },
  supporting_masses: {
    name: "Focal group with supporting masses",
    whenToUse: "When several shapes need one clear leader.",
    application:
      "Let larger quiet masses support a smaller, stronger focal group.",
    action:
      "Sketch one focal group and two quieter supporting masses; avoid equal contrast across all three.",
    description:
      "Two quiet supporting masses balance one smaller, darker focal group.",
  },
  big_shapes: {
    name: "Big-shape plan",
    whenToUse: "When detail makes the overall design hard to see.",
    application:
      "Reduce the subject to open light, a middle-value group, and one dark accent.",
    action:
      "Make a tiny three-shape study before adding details to the next painting.",
    description:
      "Open light, one middle-value band, and a connected dark mass make a simple design.",
  },
};

const safeText = (value: unknown) =>
  typeof value === "string" ? value.trim().slice(0, 2000) : "";
function excerpt(value: string) {
  const sentence = value.split(/(?<=[.!?])\s+/)[0];
  if (sentence.length <= 180) return sentence;
  return sentence.slice(0, 177).replace(/\s+\S*$/, "") + "…";
}

// Broad directions choose teaching ideas, never a detected match or a copy of
// source geometry. Uncertain locations do not determine a model arrangement.
export function selectCompositionModels(
  input: CompositionModelsInput,
): CompositionModel[] {
  const composition = safeText(input.composition),
    values = safeText(input.values);
  const text = `${composition} ${values}`;
  const candidates = new Map<
    CompositionModelId,
    { score: number; note?: CoachingOverlay; text?: string }
  >();
  function consider(
    id: CompositionModelId,
    score: number,
    note?: CoachingOverlay,
    sourceText?: string,
  ) {
    if (score > (candidates.get(id)?.score ?? -1))
      candidates.set(id, { score, note, text: sourceText });
  }
  const rules: [CompositionModelId, RegExp][] = [
    ["s_curve", /\b(s[ -]?(curve|path|shape)|winding)\b/i],
    ["diagonal", /\bdiagonal\b/i],
    ["l_foreground", /\bl[ -]shap\w*\b/i],
    ["high_horizon", /\b(high(?:er)? horizon|raise (?:the )?horizon)\b/i],
    ["low_horizon", /\b(low(?:er)? horizon|lower (?:the )?horizon)\b/i],
    [
      "dominant_foreground",
      /\b(dominant foreground|large foreground mass|foreground carries)\b/i,
    ],
    [
      "off_center",
      /\b(off[ -]cent(?:er|re)|(?:left|right) of (?:the )?cent(?:er|re)|rule of thirds)\b/i,
    ],
    ["triangle", /\b(triangle|triangular)\b/i],
    [
      "frame_in_frame",
      /\b(frame[ -]in[ -]frame|frame within a frame|window frame|doorway|archway)\b/i,
    ],
    [
      "big_light_dark",
      /\b(big light|large light|light shape.{0,45}small dark)\b/i,
    ],
    [
      "connected_shadow",
      /\b(connect(?:ed)? (?:related )?(?:shadows?|darks?)|group (?:the )?(?:related )?(?:shadows?|darks?))\b/i,
    ],
    [
      "quiet_background",
      /\b(quiet.{0,20}background|soft.{0,20}background|sharp.{0,15}focal)\b/i,
    ],
    ["lead_in", /\b(shoreline|road|street|perspective|lead[ -]in)\b/i],
    ["supporting_masses", /\b(supporting masses|focal group)\b/i],
    ["big_shapes", /\b(big shapes|large shapes|simple masses)\b/i],
  ];
  for (const [id, pattern] of rules)
    if (pattern.test(text))
      consider(
        id,
        id === "lead_in" || id === "big_shapes" ? 90 : 110,
        undefined,
        pattern.test(composition) ? composition : values,
      );
  if (/\b(street|road|shoreline)\b/i.test(safeText(input.title)))
    consider("lead_in", 70);
  for (const note of usableOverlays(input.overlays)) {
    const kind = overlayKind(note),
      category = overlayCategory(note);
    if (category === "value_structure") consider("connected_shadow", 88, note);
    if (category === "reserve_light") consider("big_light_dark", 92, note);
    if (["simplification", "atmosphere", "edge_control"].includes(category))
      consider("quiet_background", 89, note);
    if (category === "focal_point") consider("supporting_masses", 82, note);
    if (kind === "focal_ring") {
      const x = note.x + (note.width ?? 0) / 2,
        y = note.y + (note.height ?? 0) / 2;
      if (x < 42 || x > 58 || y < 42 || y > 58)
        consider("off_center", 87, note);
    }
    if (
      kind === "guide_line" &&
      note.styleHint === "horizon" &&
      note.points?.length
    ) {
      const average =
        note.points.reduce((sum, point) => sum + point.y, 0) /
        note.points.length;
      const span =
        Math.max(...note.points.map((point) => point.y)) -
        Math.min(...note.points.map((point) => point.y));
      const horizontal =
        Math.max(...note.points.map((point) => point.x)) -
        Math.min(...note.points.map((point) => point.x));
      if (span < 10 && horizontal >= 25 && average <= 38)
        consider("high_horizon", 95, note);
      if (span < 10 && horizontal >= 25 && average >= 62)
        consider("low_horizon", 95, note);
    }
    if (kind === "arrow" && note.points?.length) {
      const points = note.points,
        first = points[0],
        last = points[points.length - 1];
      const directions = points
        .slice(1)
        .map((point, i) => Math.sign(point.x - points[i].x))
        .filter(Boolean);
      const turns = directions
        .slice(1)
        .filter((direction, i) => direction !== directions[i]).length;
      const vertical = Math.abs(last.y - first.y),
        horizontal =
          Math.max(...points.map((point) => point.x)) -
          Math.min(...points.map((point) => point.x));
      if (
        points.length >= 4 &&
        turns >= 2 &&
        vertical >= 15 &&
        horizontal >= 15
      )
        consider("s_curve", 96, note);
      else if (Math.abs(last.x - first.x) >= 18 && vertical >= 18)
        consider("diagonal", 93, note);
      else consider("lead_in", 86, note);
    }
  }
  const ranked = [...candidates.entries()].sort(
    (a, b) => b[1].score - a[1].score,
  );
  const chosen: [
    CompositionModelId,
    { score: number; note?: CoachingOverlay; text?: string },
  ][] = ranked.length
    ? ranked.slice(0, 2)
    : [
        ["big_shapes", { score: 0 }],
        ["off_center", { score: 0 }],
      ];
  return chosen.map(([id, choice]) => ({
    id,
    ...compositionModelLibrary[id],
    application:
      choice.note?.shortInstruction ??
      (choice.text
        ? `For your study: ${excerpt(choice.text)}`
        : compositionModelLibrary[id].application),
  }));
}
