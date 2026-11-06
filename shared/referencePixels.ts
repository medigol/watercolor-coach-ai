import type { PixelSettings } from "./referenceStudio";
const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
const linear = (x: number) => {
  const s = x / 255;
  return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
};
export function luminance(r: number, g: number, b: number): number {
  return .2126 * linear(r) + .7152 * linear(g) + .0722 * linear(b);
}
export function adjustPixels(
  data: Uint8ClampedArray,
  s: PixelSettings,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    const rgb = [0, 1, 2].map((c) => data[i + c] * alpha + 255 * (1 - alpha));
    const grey = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
    for (let c = 0; c < 3; c++) {
      const chroma = grey + (rgb[c] - grey) * s.saturation;
      const temp = c === 0
        ? s.temperature * 50
        : c === 2
        ? -s.temperature * 50
        : 0;
      out[i + c] = clamp(
        (chroma - 127.5) * s.contrast + 127.5 + s.brightness * 255 + temp,
      );
    }
    out[i + 3] = 255;
  }
  return out;
}
export function valueStudy(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  groups: 3 | 5,
  block = 1,
): { pixels: Uint8ClampedArray; fractions: number[] } {
  if (
    !Number.isInteger(width) || !Number.isInteger(height) || width < 1 ||
    height < 1 || width * height > 2400000 ||
    data.length !== width * height * 4 || ![3, 5].includes(groups) ||
    !Number.isInteger(block) || block < 1 || block > 32
  ) throw Error("Invalid planning image");
  const out = new Uint8ClampedArray(data.length),
    counts = Array(groups).fill(0) as number[];
  // Quantise perceptual lightness, not hue. Blocks average luminance only;
  // this is approximate spatial grouping, never semantic object removal.
  for (let y = 0; y < height; y += block) {
    for (let x = 0; x < width; x += block) {
      let sum = 0, n = 0;
      for (let j = y; j < Math.min(height, y + block); j++) {
        for (let k = x; k < Math.min(width, x + block); k++) {
          const p = (j * width + k) * 4, a = data[p + 3] / 255;
          sum += luminance(
            data[p] * a + 255 * (1 - a),
            data[p + 1] * a + 255 * (1 - a),
            data[p + 2] * a + 255 * (1 - a),
          );
          n++;
        }
      }
      const meanLuminance = sum / n;
      const light = meanLuminance <= 216 / 24389
        ? meanLuminance * 24389 / 27
        : 116 * Math.cbrt(meanLuminance) - 16;
      const group = Math.min(
        groups - 1,
        Math.max(0, Math.floor(light / 100 * groups)),
      );
      const v = Math.round(group * 255 / (groups - 1));
      for (let j = y; j < Math.min(height, y + block); j++) {
        for (let k = x; k < Math.min(width, x + block); k++) {
          const p = (j * width + k) * 4;
          out[p] = out[p + 1] = out[p + 2] = v;
          out[p + 3] = 255;
          counts[group]++;
        }
      }
    }
  }
  return { pixels: out, fractions: counts.map((n) => n / (width * height)) };
}
