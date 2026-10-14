export const overlayTypes = [
  "focal_point",
  "value_adjustment",
  "simplify",
  "edge_control",
  "composition_crop",
] as const;
export interface CoachingOverlay {
  type: (typeof overlayTypes)[number];
  label: string;
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
  priority: "high" | "medium" | "low";
  shortInstruction: string;
  reason: string;
  action: string;
}
export function validOverlays(value: unknown): value is CoachingOverlay[] {
  if (
    !Array.isArray(value) ||
    (value.length !== 0 && (value.length < 3 || value.length > 5))
  )
    return false;
  const allowed = [
    "type",
    "label",
    "x",
    "y",
    "width",
    "height",
    "priority",
    "shortInstruction",
    "reason",
    "action",
  ];
  const text = (v: unknown, limit: number) =>
    typeof v === "string" && !!v.trim() && v.length <= limit;
  const percent = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
  return value.every((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const v = item as Record<string, unknown>;
    if (
      Object.keys(v).some((k) => !allowed.includes(k)) ||
      !overlayTypes.includes(v.type as CoachingOverlay["type"]) ||
      !["high", "medium", "low"].includes(v.priority as string)
    )
      return false;
    if (
      !text(v.label, 70) ||
      !text(v.shortInstruction, 160) ||
      !text(v.reason, 350) ||
      !text(v.action, 350) ||
      !percent(v.x) ||
      !percent(v.y)
    )
      return false;
    const hasWidth = v.width !== undefined && v.width !== null;
    const hasHeight = v.height !== undefined && v.height !== null;
    if (hasWidth !== hasHeight) return false;
    if (
      hasWidth &&
      (!percent(v.width) ||
        !percent(v.height) ||
        v.width <= 0 ||
        v.height <= 0 ||
        v.x + v.width > 100 ||
        v.y + v.height > 100)
    )
      return false;
    return true;
  });
}
// Coordinates describe the original image: points are anchors; region x/y are
// their top-left corner. A numbered marker sits at the region's centre.
export function overlayAnchor(note: CoachingOverlay) {
  return {
    x: note.x + (note.width ?? 0) / 2,
    y: note.y + (note.height ?? 0) / 2,
  };
}
