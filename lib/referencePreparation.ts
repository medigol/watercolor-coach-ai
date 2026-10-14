export type ReferenceView = "original" | "value" | "simplified" | "adjust";
export type ReferenceAdjustments = {
  contrast: number;
  brightness: number;
  saturation: number;
};

export const defaultAdjustments: Readonly<ReferenceAdjustments> = {
  contrast: 100,
  brightness: 100,
  saturation: 100,
};

export const adjustmentBounds = {
  contrast: { min: 50, max: 180 },
  brightness: { min: 60, max: 150 },
  saturation: { min: 0, max: 150 },
} as const;

export function referenceAspectRatio(
  width: number,
  height: number,
): number | undefined {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return undefined;
  const ratio = width / height;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : undefined;
}

export function boundedAdjustment(
  name: keyof ReferenceAdjustments,
  value: number,
): number {
  if (!Number.isFinite(value)) return defaultAdjustments[name];
  const { min, max } = adjustmentBounds[name];
  return Math.round(Math.max(min, Math.min(max, value)));
}

// These display filters never alter, save, or replace the source image.
// CSS does not read private image pixels, so cross-origin images remain usable.
export function referenceFilter(
  view: ReferenceView,
  adjustments: ReferenceAdjustments,
): string {
  if (view === "value") return "grayscale(1) contrast(1.2)";
  if (view === "simplified") return "saturate(0.65) contrast(1.1) blur(0.7px)";
  if (view !== "adjust") return "none";
  const contrast = boundedAdjustment("contrast", adjustments.contrast) / 100;
  const brightness =
    boundedAdjustment("brightness", adjustments.brightness) / 100;
  const saturation =
    boundedAdjustment("saturation", adjustments.saturation) / 100;
  return `contrast(${contrast}) brightness(${brightness}) saturate(${saturation})`;
}

export const referenceViewNotes: Record<ReferenceView, string> = {
  original:
    "Plan washes before small marks. Use this as a painting guide, not a tracing image.",
  value:
    "Look for big light, middle, and dark shapes. This is a grayscale view, not a three-value painting.",
  simplified:
    "Simplify secondary detail. A gentle display blur helps you notice larger shapes; it does not redraw the photo.",
  adjust:
    "Keep changes modest. Choose useful value and color relationships before planning your first wash.",
};
