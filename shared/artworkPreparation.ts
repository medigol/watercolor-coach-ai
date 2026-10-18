/** Local resource/geometry checks only. This does NOT classify painting media. */
import {
  validRect,
  type ImageSize,
  type NormalizedRect,
} from "./imageGeometry.ts";
export const preparationLimits = {
  bytes: 10 * 1024 * 1024,
  pixels: 16_000_000,
  side: 12_000,
  outputSide: 3072,
  minSide: 64,
  minPixels: 65_536,
} as const;
export const fullArtwork: NormalizedRect = { x: 0, y: 0, width: 1, height: 1 };
export function validateDimensions(size: ImageSize): void {
  const { width: w, height: h } = size;
  if (
    ![w, h].every(
      (v) => Number.isSafeInteger(v) && v >= preparationLimits.minSide,
    ) ||
    w * h < preparationLimits.minPixels
  )
    throw new Error(
      "Choose a clearer image with at least 256 × 256 pixels of artwork (or equivalent area).",
    );
  if (
    w > preparationLimits.side ||
    h > preparationLimits.side ||
    w * h > preparationLimits.pixels
  )
    throw new Error(
      "This image is too large to prepare safely. Choose a copy up to 16 megapixels and 12,000 pixels per side.",
    );
}
export interface ImageHeader extends ImageSize {
  mime: "image/png" | "image/jpeg" | "image/webp";
  orientation: number;
}
/** Read dimensions BEFORE decoded buffers. JPEG APP1 orientation is display-only;
 * decoders normalize it once, never rotate the oriented result a second time. */
export function imageHeader(bytes: Uint8Array): ImageHeader {
  if (!bytes.length || bytes.length > preparationLimits.bytes)
    throw new Error("Choose a JPEG, PNG or WebP smaller than 10 MB.");
  const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let w = 0,
    h = 0,
    orientation = 1,
    mime: ImageHeader["mime"];
  if (
    bytes.length >= 24 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
  ) {
    mime = "image/png";
    if (d.getUint32(12) !== 0x49484452)
      throw new Error("This image could not be read.");
    w = d.getUint32(16);
    h = d.getUint32(20);
  } else if (
    bytes.length >= 12 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  ) {
    mime = "image/jpeg";
    for (let p = 2; p + 4 <= bytes.length; ) {
      if (bytes[p] !== 255) break;
      const marker = bytes[p + 1];
      if (marker === 0xda || marker === 0xd9) break;
      const length = d.getUint16(p + 2);
      if (length < 2 || p + 2 + length > bytes.length)
        throw new Error("This image could not be read.");
      if (
        marker === 0xe1 &&
        length >= 16 &&
        d.getUint32(p + 4) === 0x45786966 &&
        d.getUint16(p + 8) === 0
      ) {
        const t = p + 10,
          le = d.getUint16(t) === 0x4949;
        if (
          (le || d.getUint16(t) === 0x4d4d) &&
          d.getUint16(t + 2, le) === 42
        ) {
          const ifd = t + d.getUint32(t + 4, le),
            end = p + 2 + length;
          if (ifd >= t + 8 && ifd + 2 <= end) {
            const n = Math.min(d.getUint16(ifd, le), 128);
            for (let i = 0; i < n; i++) {
              const at = ifd + 2 + i * 12;
              if (at + 12 > end) break;
              if (
                d.getUint16(at, le) === 0x112 &&
                d.getUint16(at + 2, le) === 3 &&
                d.getUint32(at + 4, le) === 1
              ) {
                const o = d.getUint16(at + 8, le);
                if (o >= 1 && o <= 8) orientation = o;
              }
            }
          }
        }
      }
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker) &&
        length >= 8
      ) {
        h = d.getUint16(p + 5);
        w = d.getUint16(p + 7);
      }
      p += 2 + length;
    }
  } else if (
    bytes.length >= 30 &&
    d.getUint32(0) === 0x52494646 &&
    d.getUint32(8) === 0x57454250
  ) {
    mime = "image/webp";
    const chunk = d.getUint32(12);
    if (chunk === 0x56503858) {
      w = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      h = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (
      chunk === 0x56503820 &&
      bytes[23] === 0x9d &&
      bytes[24] === 1 &&
      bytes[25] === 0x2a
    ) {
      w = d.getUint16(26, true) & 0x3fff;
      h = d.getUint16(28, true) & 0x3fff;
    } else if (chunk === 0x5650384c && bytes[20] === 0x2f) {
      const bits = d.getUint32(21, true);
      w = 1 + (bits & 0x3fff);
      h = 1 + ((bits >>> 14) & 0x3fff);
    }
  } else throw new Error("Choose a JPEG, PNG or WebP image.");
  validateDimensions({ width: w, height: h });
  return { width: w, height: h, mime: mime!, orientation };
}
export function orientedDimensions(h: ImageHeader): ImageSize {
  return h.orientation >= 5
    ? { width: h.height, height: h.width }
    : { width: h.width, height: h.height };
}
export function cropPixels(region: NormalizedRect, size: ImageSize) {
  if (!validRect(region)) throw new Error("Select a crop inside the image.");
  // Round both edges, not width independently: output cannot escape the source.
  const x = Math.round(region.x * size.width),
    y = Math.round(region.y * size.height);
  const width = Math.round((region.x + region.width) * size.width) - x,
    height = Math.round((region.y + region.height) * size.height) - y;
  validateDimensions({ width, height });
  return { originX: x, originY: y, width, height };
}
export function outputDimensions(size: ImageSize): ImageSize {
  // Preserve legitimate panoramic/minimal artwork: resizing must not make a
  // previously valid short side or pixel area fail our own output gate.
  const minimumScale = Math.max(
    preparationLimits.minSide / Math.min(size.width, size.height),
    Math.sqrt(preparationLimits.minPixels / (size.width * size.height)),
  );
  const scale = Math.min(
    1,
    Math.max(
      minimumScale,
      preparationLimits.outputSide / Math.max(size.width, size.height),
    ),
  );
  return {
    width: Math.ceil(size.width * scale),
    height: Math.ceil(size.height * scale),
  };
}
export function isFullArtwork(r: NormalizedRect) {
  return r.x === 0 && r.y === 0 && r.width === 1 && r.height === 1;
}
/** High precision, low recall rectangular-surround suggestion. Uniform border,
 * four stable straight transitions and a complete interior are required. This
 * cannot tell paper from wall, frame or painted white; user confirmation is mandatory. */
export function boundaryProposal(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
): NormalizedRect | null {
  if (w < 32 || h < 32 || w > 160 || h > 160 || rgba.length !== w * h * 4)
    return null;
  const rgb = (x: number, y: number) => {
    const p = (y * w + x) * 4,
      a = rgba[p + 3] / 255;
    return [0, 1, 2].map((c) => Math.round(rgba[p + c] * a + 255 * (1 - a)));
  };
  const corners = [rgb(0, 0), rgb(w - 1, 0), rgb(0, h - 1), rgb(w - 1, h - 1)],
    base = corners[0];
  const dist = (a: number[], b: number[]) =>
    Math.max(...a.map((c, i) => Math.abs(c - b[i])));
  if (corners.some((c) => dist(c, base) > 10)) return null;
  const outer = [];
  for (let x = 0; x < w; x++) outer.push(rgb(x, 0), rgb(x, h - 1));
  for (let y = 1; y < h - 1; y++) outer.push(rgb(0, y), rgb(w - 1, y));
  if (outer.filter((c) => dist(c, base) < 14).length / outer.length < 0.98)
    return null;
  const mask = Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => dist(rgb(x, y), base) > 28),
  );
  const rows = mask.map((row) => row.flatMap((v, x) => (v ? [x] : [])));
  const occupied = rows.flatMap((xs, y) => (xs.length ? [y] : []));
  if (!occupied.length) return null;
  const top = occupied[0],
    bottom = occupied.at(-1)!;
  const xs = rows.flat();
  const left = Math.min(...xs),
    right = Math.max(...xs);
  if (left < 3 || top < 3 || right > w - 4 || bottom > h - 4) return null;
  const area = ((right - left + 1) * (bottom - top + 1)) / (w * h);
  if (area < 0.25 || area > 0.9) return null;
  // All four candidate edges must be substantially continuous. Irregular paint
  // on white paper should fail this gate rather than lose its artistic margin.
  const rate = (list: boolean[]) => list.filter(Boolean).length / list.length;
  if (
    [
      rate(mask[top].slice(left, right + 1)),
      rate(mask[bottom].slice(left, right + 1)),
      rate(mask.slice(top, bottom + 1).map((row) => row[left])),
      rate(mask.slice(top, bottom + 1).map((row) => row[right])),
    ].some((v) => v < 0.96)
  )
    return null;
  // Include one sample-cell outside detected edge; never silently trim it.
  return {
    x: (left - 1) / w,
    y: (top - 1) / h,
    width: (right - left + 3) / w,
    height: (bottom - top + 3) / h,
  };
}
