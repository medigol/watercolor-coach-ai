/**
 * Image-space geometry for all coaching views. Persist only coordinates in 0–1;
 * the original image's intrinsic dimensions determine every displayed transform.
 * This module is also safe to import in the Edge Function: it has no UI or I/O.
 */
export interface ImageSize {
  width: number;
  height: number;
}
export interface NormalizedPoint {
  x: number;
  y: number;
}
export interface NormalizedRect extends NormalizedPoint, ImageSize {}
/** Reusable primitives for later deterministic study overlays, without new UI. */
export type NormalizedGeometry =
  | { type: "point"; point: NormalizedPoint }
  | { type: "rectangle"; region: NormalizedRect }
  | { type: "ellipse"; bounds: NormalizedRect }
  | { type: "polyline"; points: NormalizedPoint[] }
  | { type: "polygon"; points: NormalizedPoint[] }
  | { type: "multiple"; regions: NormalizedRect[]; anchors: NormalizedPoint[] };
/** A runtime pixel frame; unlike normalized geometry, this is never persisted. */
export interface ImageFrame extends NormalizedPoint, ImageSize {
  scale: number;
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const unit = (value: unknown): value is number =>
  finite(value) && value >= 0 && value <= 1;
const exactKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

export function validSize(value: unknown): value is ImageSize {
  return (
    record(value) &&
    finite(value.width) &&
    value.width > 0 &&
    finite(value.height) &&
    value.height > 0
  );
}
export function validPoint(value: unknown): value is NormalizedPoint {
  return (
    record(value) &&
    exactKeys(value, ["x", "y"]) &&
    unit(value.x) &&
    unit(value.y)
  );
}
export function validRect(value: unknown): value is NormalizedRect {
  return (
    record(value) &&
    exactKeys(value, ["x", "y", "width", "height"]) &&
    unit(value.x) &&
    unit(value.y) &&
    unit(value.width) &&
    value.width > 0 &&
    unit(value.height) &&
    value.height > 0 &&
    value.x + value.width <= 1 + Number.EPSILON &&
    value.y + value.height <= 1 + Number.EPSILON
  );
}
export function validPath(
  value: unknown,
  minPoints = 2,
  maxPoints = 12,
): value is NormalizedPoint[] {
  return (
    Array.isArray(value) &&
    value.length >= minPoints &&
    value.length <= maxPoints &&
    value.every(validPoint) &&
    value.some(
      (point) =>
        Math.abs(point.x - value[0].x) + Math.abs(point.y - value[0].y) > 1e-7,
    )
  );
}
export function validPolygon(
  value: unknown,
  maxPoints = 12,
): value is NormalizedPoint[] {
  if (!validPath(value, 3, maxPoints)) return false;
  const first = value[0],
    last = value[value.length - 1];
  const points =
    first.x === last.x && first.y === last.y ? value.slice(0, -1) : value;
  if (points.length < 3) return false;
  const twiceArea = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  if (Math.abs(twiceArea) <= 1e-7) return false;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      if (
        segmentsMeet(
          points[i],
          points[(i + 1) % points.length],
          points[j],
          points[(j + 1) % points.length],
        )
      )
        return false;
    }
  }
  return true;
}
function segmentsMeet(
  a: NormalizedPoint,
  b: NormalizedPoint,
  c: NormalizedPoint,
  d: NormalizedPoint,
) {
  const cross = (p: NormalizedPoint, q: NormalizedPoint, r: NormalizedPoint) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const onSegment = (
    p: NormalizedPoint,
    q: NormalizedPoint,
    r: NormalizedPoint,
  ) =>
    r.x >= Math.min(p.x, q.x) &&
    r.x <= Math.max(p.x, q.x) &&
    r.y >= Math.min(p.y, q.y) &&
    r.y <= Math.max(p.y, q.y);
  const abC = cross(a, b, c),
    abD = cross(a, b, d);
  const cdA = cross(c, d, a),
    cdB = cross(c, d, b);
  return (
    (abC * abD < 0 && cdA * cdB < 0) ||
    (Math.abs(abC) < 1e-9 && onSegment(a, b, c)) ||
    (Math.abs(abD) < 1e-9 && onSegment(a, b, d)) ||
    (Math.abs(cdA) < 1e-9 && onSegment(c, d, a)) ||
    (Math.abs(cdB) < 1e-9 && onSegment(c, d, b))
  );
}

/** The complete source image fitted inside a viewport, including letterboxing. */
export function containFrame(
  source: ImageSize,
  viewport: ImageSize,
): ImageFrame | null {
  if (!validSize(source) || !validSize(viewport)) return null;
  const widthScale = viewport.width / source.width;
  const heightScale = viewport.height / source.height;
  const scale = Math.min(widthScale, heightScale);
  if (!finite(scale) || scale <= 0) return null;
  const ratio = source.width / source.height;
  // Keep the constrained edge exact so floating arithmetic cannot overrun it.
  const width =
    widthScale <= heightScale ? viewport.width : viewport.height * ratio;
  const height =
    widthScale <= heightScale ? viewport.width / ratio : viewport.height;
  return {
    x: (viewport.width - width) / 2,
    y: (viewport.height - height) / 2,
    width,
    height,
    scale,
  };
}
export function projectPoint(
  point: NormalizedPoint,
  frame: Pick<ImageFrame, "x" | "y" | "width" | "height">,
): NormalizedPoint {
  return {
    x: frame.x + point.x * frame.width,
    y: frame.y + point.y * frame.height,
  };
}
export function projectRect(
  rect: NormalizedRect,
  frame: Pick<ImageFrame, "x" | "y" | "width" | "height">,
): NormalizedRect {
  return {
    ...projectPoint(rect, frame),
    width: rect.width * frame.width,
    height: rect.height * frame.height,
  };
}

/** Convert existing percent-space JSON at one boundary; never store pixels. */
export function legacyPoint(value: unknown): NormalizedPoint | null {
  if (!record(value) || !finite(value.x) || !finite(value.y)) return null;
  const point = { x: value.x / 100, y: value.y / 100 };
  return validPoint(point) ? point : null;
}
export function legacyGeometry(value: unknown): {
  point: NormalizedPoint;
  rect: NormalizedRect | null;
  points: NormalizedPoint[];
} | null {
  const point = legacyPoint(value);
  if (!point || !record(value)) return null;
  const rect = {
    ...point,
    width: finite(value.width) ? value.width / 100 : 0,
    height: finite(value.height) ? value.height / 100 : 0,
  };
  const points = Array.isArray(value.points)
    ? value.points.map(legacyPoint)
    : [];
  return {
    point,
    rect: validRect(rect) ? rect : null,
    points: points.every((item) => item !== null) ? points : [],
  };
}
function pointBounds(points: NormalizedPoint[]): NormalizedRect {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs),
    y = Math.min(...ys);
  return {
    x,
    y,
    width: Math.max(...xs) - x,
    height: Math.max(...ys) - y,
  };
}

function reliableGeometry(value: Record<string, unknown>) {
  // Older results omitted confidence. Explicit null in newer JSON means the
  // model abstained; it must not reactivate a leftover legacy image anchor.
  return (
    !Object.prototype.hasOwnProperty.call(value, "regionConfidence") ||
    (unit(value.regionConfidence) && value.regionConfidence >= 0.65)
  );
}
function localRegion(value: Record<string, unknown>): NormalizedRect | null {
  if (
    Object.prototype.hasOwnProperty.call(value, "region") ||
    value.regionConfidence != null
  ) {
    if (
      !validRect(value.region) ||
      (value.regionConfidence != null &&
        (!unit(value.regionConfidence) || value.regionConfidence < 0.65))
    )
      return null;
    return { ...value.region };
  }
  const legacy = legacyGeometry(value);
  if (!legacy) return null;
  if (legacy.rect) return legacy.rect;
  const regionTypes = ["region_highlight", "value_mass", "simplify_region"];
  if (
    regionTypes.includes(value.type as string) &&
    validPolygon(legacy.points)
  ) {
    const bounds = pointBounds(legacy.points);
    return validRect(bounds) ? bounds : null;
  }
  return null;
}

/** Individual valid regions, never a fabricated box around a relationship. */
export function noteRegions(value: unknown): NormalizedRect[] {
  if (!record(value) || value.scope === "global" || !reliableGeometry(value))
    return [];
  if (value.scope === "multi_region") {
    if (!Array.isArray(value.regions)) return [];
    const regions = value.regions.slice(0, 4).filter(validRect);
    return regions
      .filter(
        (region, index) =>
          regions.findIndex(
            (other) =>
              other.x === region.x &&
              other.y === region.y &&
              other.width === region.width &&
              other.height === region.height,
          ) === index,
      )
      .map((region) => ({ ...region }));
  }
  const region = localRegion(value);
  return region ? [region] : [];
}
/** A crop is appropriate only for one local observation. */
export function noteRegion(value: unknown): NormalizedRect | null {
  if (
    !record(value) ||
    value.scope === "global" ||
    value.scope === "multi_region"
  )
    return null;
  return noteRegions(value)[0] ?? null;
}

/** All true targets, before separate touch-label collision adjustments. */
export function noteAnchors(value: unknown): NormalizedPoint[] {
  if (!record(value) || value.scope === "global" || !reliableGeometry(value))
    return [];
  const centers = noteRegions(value).map((region) => ({
    x: region.x + region.width / 2,
    y: region.y + region.height / 2,
  }));
  if (value.scope === "multi_region") {
    const supplied = Array.isArray(value.anchors)
      ? value.anchors.slice(0, 4).filter(validPoint)
      : [];
    const points = [...centers, ...supplied];
    return points.filter(
      (point, index) =>
        points.findIndex(
          (other) =>
            Math.abs(other.x - point.x) + Math.abs(other.y - point.y) < 1e-7,
        ) === index,
    );
  }
  if (centers.length) return centers;
  const legacy = legacyGeometry(value);
  if (!legacy) return [];
  if (legacy.rect)
    return [
      {
        x: legacy.rect.x + legacy.rect.width / 2,
        y: legacy.rect.y + legacy.rect.height / 2,
      },
    ];
  if (legacy.points.length) {
    const bounds = pointBounds(legacy.points);
    return [
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    ];
  }
  return [legacy.point];
}

/** Uncertain and whole-image notes retain text without fake local graphics. */
export function noteGeometryVisible(value: unknown): boolean {
  if (!record(value) || value.scope === "global" || !reliableGeometry(value))
    return false;
  const anchors = noteAnchors(value);
  return value.scope === "multi_region"
    ? anchors.length >= 2
    : anchors.length > 0;
}

/** A true image anchor, before any separate touch-label collision adjustment. */
export function noteAnchor(value: unknown): NormalizedPoint | null {
  return noteAnchors(value)[0] ?? null;
}

export interface CropView {
  /** Context-padded bounds in normalized intrinsic image space. */
  bounds: NormalizedRect;
  viewport: ImageSize;
  /** Render the same source URI with this size/offset inside a clipped view. */
  image: NormalizedRect;
  /** Target highlight in local crop-view pixels, using the same transform. */
  target: NormalizedRect;
  scale: number;
}

/** A temporary presentation view; it neither creates nor writes an image asset. */
export function cropView(
  region: NormalizedRect,
  source: ImageSize,
  maxViewport: ImageSize,
  padding?: number,
  maxScale = 1.25,
): CropView | null {
  if (
    !validRect(region) ||
    !validSize(source) ||
    !validSize(maxViewport) ||
    (padding !== undefined &&
      (!finite(padding) || padding < 0 || padding > 2)) ||
    !finite(maxScale) ||
    maxScale <= 0 ||
    maxScale > 2 ||
    region.width * source.width < 2 ||
    region.height * source.height < 2
  )
    return null;
  // Small subjects need their surroundings; large passages need less expansion.
  const contextRatio =
    padding ?? 0.12 + 0.9 * (1 - Math.sqrt(region.width * region.height)) ** 2;
  const padX = Math.max(region.width * contextRatio, 0.025);
  const padY = Math.max(region.height * contextRatio, 0.025);
  const x = Math.max(0, region.x - padX);
  const y = Math.max(0, region.y - padY);
  const right = Math.min(1, region.x + region.width + padX);
  const bottom = Math.min(1, region.y + region.height + padY);
  const bounds = { x, y, width: right - x, height: bottom - y };
  const cropWidth = bounds.width * source.width;
  const cropHeight = bounds.height * source.height;
  const scale = Math.min(
    maxViewport.width / cropWidth,
    maxViewport.height / cropHeight,
    maxScale,
  );
  const viewport = { width: cropWidth * scale, height: cropHeight * scale };
  // A crop too small to be useful should leave its valid note text untouched.
  if (viewport.width < 32 || viewport.height < 32) return null;
  const image = {
    x: -bounds.x * source.width * scale,
    y: -bounds.y * source.height * scale,
    width: source.width * scale,
    height: source.height * scale,
  };
  const target = projectRect(region, image);
  if (target.width < 4 || target.height < 4) return null;
  return { bounds, viewport, image, target, scale };
}
