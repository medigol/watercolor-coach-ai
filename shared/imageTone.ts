import { validRect, type NormalizedRect } from "./imageGeometry.ts";

/** Measurements of a bounded raster sample, NOT a quality/focal-confidence score.
 * sRGB is decoded to linear light before Rec.709 relative luminance. Alpha is
 * composited over white paper in sRGB, matching the existing upload matte. */
export function linearSrgb(channel: number): number {
  const c = Math.max(0, Math.min(255, channel)) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
export function pixelLuminance(
  r: number,
  g: number,
  b: number,
  alpha = 255,
): number {
  const a = Math.max(0, Math.min(255, alpha)) / 255;
  const matte = (c: number) => linearSrgb(c * a + 255 * (1 - a));
  return 0.2126 * matte(r) + 0.7152 * matte(g) + 0.0722 * matte(b);
}
export interface ToneSample {
  width: number;
  height: number;
  /** Same upright analysed source, at most 256x256; never persisted or uploaded. */
  luminance: Float32Array;
  rgba: Uint8ClampedArray;
}
export function toneSample(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
): ToneSample | null {
  if (
    ![width, height].every(
      (n) => Number.isSafeInteger(n) && n > 0 && n <= 256,
    ) ||
    rgba.length !== width * height * 4
  )
    return null;
  const luminance = new Float32Array(width * height);
  for (let i = 0; i < luminance.length; i++) {
    const p = i * 4;
    if (
      ![rgba[p], rgba[p + 1], rgba[p + 2], rgba[p + 3]].every(
        (n) => Number.isFinite(n) && n >= 0 && n <= 255,
      )
    )
      return null;
    luminance[i] = pixelLuminance(
      rgba[p],
      rgba[p + 1],
      rgba[p + 2],
      rgba[p + 3],
    );
  }
  return { width, height, luminance, rgba: Uint8ClampedArray.from(rgba) };
}
export interface ToneRange {
  low: number;
  median: number;
  high: number;
  count: number;
}
export function regionTone(
  sample: ToneSample,
  region: NormalizedRect,
): ToneRange | null {
  if (
    !validRect(region) ||
    sample.luminance.length !== sample.width * sample.height
  )
    return null;
  // Sample centres must lie INSIDE the original canonical region. Context added
  // to presentation crops never contaminates a subject's measured statistic.
  const values: number[] = [];
  for (let y = 0; y < sample.height; y++)
    for (let x = 0; x < sample.width; x++) {
      const px = (x + 0.5) / sample.width,
        py = (y + 0.5) / sample.height;
      if (
        px >= region.x &&
        px <= region.x + region.width &&
        py >= region.y &&
        py <= region.y + region.height
      )
        values.push(sample.luminance[y * sample.width + x]);
    }
  if (
    values.length < 16 ||
    values.some((n) => !Number.isFinite(n) || n < 0 || n > 1)
  )
    return null;
  values.sort((a, b) => a - b);
  return {
    low: values[Math.floor((values.length - 1) * 0.1)],
    median: values[Math.floor((values.length - 1) * 0.5)],
    high: values[Math.floor((values.length - 1) * 0.9)],
    count: values.length,
  };
}
export function compareTone(
  a: ToneRange,
  b: ToneRange,
): "similar" | "first_darker" | "first_lighter" {
  // A deliberately coarse 0.04 linear-light tolerance avoids false precision
  // in compressed photographs. It is not a perceptual/artistic salience test.
  return Math.abs(a.median - b.median) < 0.04
    ? "similar"
    : a.median < b.median
      ? "first_darker"
      : "first_lighter";
}

/** Coarse independent contradiction screen, not pigment/subject recognition.
 * Keep a tiny genuine accent; abstain for neutral/low-chroma colours. */
export function regionColourSupport(
  sample: ToneSample,
  region: NormalizedRect,
  hex: string,
): boolean | null {
  if (!validRect(region) || !/^#[a-f\d]{6}$/i.test(hex)) return null;
  const hue = (r: number, g: number, b: number): number | null => {
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      delta = max - min;
    if (delta < 20 || max === 0 || delta / max < 0.15) return null;
    return (
      ((max === r
        ? (g - b) / delta
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4) *
        60 +
        360) %
      360
    );
  };
  const target = hue(
    ...([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
      number,
      number,
      number,
    ]),
  );
  if (target === null) return null;
  let count = 0,
    coloured = 0,
    matches = 0;
  for (let y = 0; y < sample.height; y++)
    for (let x = 0; x < sample.width; x++) {
      const px = (x + 0.5) / sample.width,
        py = (y + 0.5) / sample.height;
      if (
        px < region.x ||
        px > region.x + region.width ||
        py < region.y ||
        py > region.y + region.height
      )
        continue;
      const i = (y * sample.width + x) * 4,
        a = sample.rgba[i + 3] / 255;
      const measured = hue(
        ...([0, 1, 2].map((c) => sample.rgba[i + c] * a + 255 * (1 - a)) as [
          number,
          number,
          number,
        ]),
      );
      count++;
      if (measured === null) continue;
      coloured++;
      const difference = Math.abs(measured - target);
      if (Math.min(difference, 360 - difference) <= 35) matches++;
    }
  if (count < 16 || coloured < count * 0.25) return null;
  return matches >= Math.max(3, count * 0.03);
}
