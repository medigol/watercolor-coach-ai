import { noteAnchor } from "../shared/imageGeometry.ts";
import {
  sanitizeVisualMetadata,
  validVisualMetadata,
  visualMetadataFields,
} from "../shared/visualMetadata.ts";
import type { VisualNoteMetadata } from "../shared/visualMetadata.ts";
export const legacyOverlayTypes = [
  "focal_point",
  "value_adjustment",
  "simplify",
  "edge_control",
  "composition_crop",
] as const;
export const visualOverlayTypes = [
  "point_marker",
  "focal_ring",
  "region_highlight",
  "guide_line",
  "arrow",
  "crop_box",
  "edge_mark",
  "value_mass",
] as const;
export const semanticOverlayTypes = [
  "eye_flow_arrow",
  "composition_line",
  "simplify_region",
  "reserve_light_mark",
] as const;
export const overlayTypes = [
  ...legacyOverlayTypes,
  ...visualOverlayTypes,
  ...semanticOverlayTypes,
] as const;
export const overlayTimings = [
  "current_painting",
  "next_study",
  "both",
] as const;
export type OverlayTiming = (typeof overlayTimings)[number];
export const overlayCategories = [
  "focal_point",
  "composition",
  "value_structure",
  "simplification",
  "edge_control",
  "atmosphere",
  "color_temperature",
  "reserve_light",
] as const;
export const overlayStyleHints = [
  "soft",
  "hard",
  "muted",
  "darken",
  "lighten",
  "simplify",
  "preserve_light",
  "crop",
  "focal",
  "eye_flow",
  "horizon",
  "connect_shadow",
] as const;
export type OverlayKind = (typeof visualOverlayTypes)[number];
export type OverlayCategory = (typeof overlayCategories)[number];
export interface OverlayPoint {
  x: number;
  y: number;
}
export interface CoachingOverlay extends VisualNoteMetadata {
  type: (typeof overlayTypes)[number];
  id?: string | null;
  category?: OverlayCategory | null;
  label: string;
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
  points?: OverlayPoint[] | null;
  styleHint?: (typeof overlayStyleHints)[number] | null;
  valueGroup?: "light" | "middle" | "dark" | null;
  timing?: OverlayTiming | null;
  priority: "high" | "medium" | "low";
  shortInstruction: string;
  reason: string;
  action: string;
}
const allowed = [
  ...visualMetadataFields,
  "type",
  "id",
  "category",
  "label",
  "x",
  "y",
  "width",
  "height",
  "points",
  "styleHint",
  "valueGroup",
  "timing",
  "priority",
  "shortInstruction",
  "reason",
  "action",
];
const text = (v: unknown, limit: number) =>
  typeof v === "string" && !!v.trim() && v.length <= limit;
const percent = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
function validTextMetadata(item: unknown): item is Record<string, unknown> {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  const v = item as Record<string, unknown>;
  if (
    Object.keys(v).some((k) => !allowed.includes(k)) ||
    !overlayTypes.includes(v.type as CoachingOverlay["type"]) ||
    !["high", "medium", "low"].includes(v.priority as string) ||
    !text(v.label, 70) ||
    !text(v.shortInstruction, 160) ||
    !text(v.reason, 350) ||
    !text(v.action, 350) ||
    !percent(v.x) ||
    !percent(v.y)
  )
    return false;
  if (
    v.id != null &&
    (typeof v.id !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(v.id))
  ) {
    return false;
  }
  if (
    v.category != null &&
    !overlayCategories.includes(v.category as OverlayCategory)
  ) {
    return false;
  }
  if (
    v.styleHint != null &&
    !overlayStyleHints.includes(
      v.styleHint as NonNullable<CoachingOverlay["styleHint"]>,
    )
  ) {
    return false;
  }
  if (
    v.valueGroup != null &&
    !["light", "middle", "dark"].includes(v.valueGroup as string)
  ) {
    return false;
  }
  if (v.timing != null && !overlayTimings.includes(v.timing as OverlayTiming)) {
    return false;
  }
  return true;
}
function validOverlay(item: unknown): item is CoachingOverlay {
  if (!validTextMetadata(item) || !validVisualMetadata(item)) return false;
  const v = item;
  const x = v.x as number;
  const y = v.y as number;
  const hasWidth = v.width != null;
  const hasHeight = v.height != null;
  if (hasWidth !== hasHeight) return false;
  if (
    hasWidth &&
    (!percent(v.width) ||
      !percent(v.height) ||
      v.width <= 0 ||
      v.height <= 0 ||
      x + v.width > 100 ||
      y + v.height > 100)
  )
    return false;
  const hasPoints = v.points != null;
  if (
    hasPoints &&
    (!Array.isArray(v.points) ||
      v.points.length < 2 ||
      v.points.length > 12 ||
      !v.points.every(
        (p) =>
          p &&
          typeof p === "object" &&
          !Array.isArray(p) &&
          Object.keys(p).length === 2 &&
          Object.keys(p).every((k) => k === "x" || k === "y") &&
          percent(p.x) &&
          percent(p.y),
      ))
  )
    return false;
  // Geometric marks must carry enough information to draw their intended shape.
  // Missing coordinates are discarded rather than replaced with invented shapes.
  const type = v.type as CoachingOverlay["type"];
  const kind = semanticKind(type) ?? type;
  if (hasPoints) {
    const points = v.points as OverlayPoint[];
    const first = points[0];
    if (
      !points.some(
        (p) => Math.abs(p.x - first.x) + Math.abs(p.y - first.y) > 0.000001,
      )
    ) {
      return false;
    }
    if (kind === "region_highlight" || kind === "value_mass") {
      const twiceArea = points.reduce((sum, p, i) => {
        const next = points[(i + 1) % points.length];
        return sum + p.x * next.y - next.x * p.y;
      }, 0);
      if (Math.abs(twiceArea) <= 0.000001) return false;
    }
  }
  if (kind === "focal_ring" || kind === "crop_box") {
    return hasWidth && !hasPoints;
  }
  if (kind === "region_highlight" || kind === "value_mass") {
    return (
      hasWidth !== hasPoints &&
      (!hasPoints || (v.points as OverlayPoint[]).length >= 3)
    );
  }
  if (["guide_line", "arrow", "edge_mark"].includes(kind)) {
    return hasPoints && !hasWidth;
  }
  if (kind === "point_marker") return !hasWidth && !hasPoints;
  return !hasPoints; // Original saved markers retain their point/region behavior.
}
export function validOverlays(value: unknown): value is CoachingOverlay[] {
  if (!Array.isArray(value) || value.length > 6 || !value.every(validOverlay)) {
    return false;
  }
  const ids = value.map((item) => item.id).filter((id) => id != null);
  return new Set(ids).size === ids.length;
}
// Optional notes are independent: one malformed note must not hide useful ones.
export function usableOverlays(value: unknown): CoachingOverlay[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: CoachingOverlay[] = [];
  // Bound work even for externally supplied saved JSON; never manufacture marks.
  for (const raw of value.slice(0, 32)) {
    const item = sanitizeVisualMetadata(raw);
    let note: CoachingOverlay;
    if (validOverlay(item)) note = item;
    else if (validTextMetadata(item)) {
      // Keep a useful coaching card at its supplied anchor when its shape fails.
      // Invalid geometry is removed; no replacement path or coordinates are invented.
      const {
        width: _width,
        height: _height,
        points: _points,
        ...metadata
      } = item;
      note = {
        ...metadata,
        type: "point_marker",
        category: overlayCategory(item as unknown as CoachingOverlay),
      } as CoachingOverlay;
    } else continue;
    if (note.id && seen.has(note.id)) continue;
    if (note.id) seen.add(note.id);
    result.push(note);
    if (result.length === 6) break;
  }
  return result;
}
function semanticKind(type: CoachingOverlay["type"]): OverlayKind | null {
  if (type === "eye_flow_arrow") return "arrow";
  if (type === "composition_line") return "guide_line";
  if (type === "simplify_region") return "region_highlight";
  if (type === "reserve_light_mark") return "focal_ring";
  return null;
}
export function overlayKind(note: CoachingOverlay): OverlayKind {
  const semantic = semanticKind(note.type);
  if (semantic) return semantic;
  if (visualOverlayTypes.includes(note.type as OverlayKind)) {
    return note.type as OverlayKind;
  }
  if (note.type === "focal_point") {
    return note.width != null ? "focal_ring" : "point_marker";
  }
  if (note.type === "composition_crop") {
    return note.width != null ? "crop_box" : "point_marker";
  }
  if (note.width != null) {
    return note.type === "value_adjustment" ? "value_mass" : "region_highlight";
  }
  return "point_marker";
}
export function overlayCategory(note: CoachingOverlay): OverlayCategory {
  // A semantic mark's purpose takes precedence over contradictory saved metadata.
  if (note.type === "reserve_light_mark") return "reserve_light";
  if (note.type === "simplify_region") return "simplification";
  if (note.type === "eye_flow_arrow" || note.type === "composition_line") {
    return "composition";
  }
  if (note.category) return note.category;
  if (note.type === "focal_point" || note.type === "focal_ring") {
    return "focal_point";
  }
  if (note.type === "value_adjustment" || note.type === "value_mass") {
    return "value_structure";
  }
  if (note.type === "simplify" || note.type === "region_highlight") {
    return "simplification";
  }
  if (note.type === "edge_control" || note.type === "edge_mark") {
    return "edge_control";
  }
  return "composition";
}
// Coordinates describe the original image: boxes use top-left x/y. For paths,
// anchor the numbered marker at their bounds' centre, independently of layout.
export function overlayAnchor(note: CoachingOverlay): OverlayPoint {
  const anchor = noteAnchor(note) ?? { x: 0, y: 0 };
  return { x: anchor.x * 100, y: anchor.y * 100 };
}
