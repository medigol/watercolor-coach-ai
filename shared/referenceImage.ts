/** Header limits precede full decoding, which remains mandatory at both boundaries. */
export const referenceByteLimit = 10 * 1024 * 1024;
export function imageHeader(
  b: Uint8Array,
): { mime: "image/png" | "image/jpeg"; width: number; height: number } {
  if (b.length < 32 || b.length > referenceByteLimit) {
    throw Error("Choose a JPEG or PNG smaller than 10 MB.");
  }
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let width = 0, height = 0, mime: "image/png" | "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v)) {
    mime = "image/png";
    if (
      view.getUint32(8) !== 13 ||
      String.fromCharCode(...b.slice(12, 16)) !== "IHDR"
    ) throw Error("Invalid PNG.");
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (
    b[0] === 255 && b[1] === 216 && b[b.length - 2] === 255 &&
    b[b.length - 1] === 217
  ) {
    mime = "image/jpeg";
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i++] !== 255) throw Error("Invalid JPEG.");
      while (b[i] === 255) i++;
      const m = b[i++];
      if (m === 0xda || m === 0xd9) break;
      if (m === 0x01 || m >= 0xd0 && m <= 0xd7) continue;
      const size = view.getUint16(i);
      if (size < 2 || i + size > b.length) throw Error("Invalid JPEG.");
      if ([0xc0, 0xc1, 0xc2].includes(m)) {
        height = view.getUint16(i + 3);
        width = view.getUint16(i + 5);
        break;
      }
      i += size;
    }
  } else {throw Error(
      "Choose a JPEG or PNG. Animated, SVG, HEIC and WebP inputs are not supported by this studio.",
    );}
  if (
    !width || !height || width < 16 || height < 16 || width > 4096 ||
    height > 4096 || width * height > 8000000
  ) {
    throw Error(
      "Choose a photo between 16 and 4096 pixels per side, up to 8 megapixels.",
    );
  }
  return { mime, width, height };
}
export async function imageHash(bytes: Uint8Array): Promise<string> {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new Uint8Array(bytes).buffer),
    ),
  ].map((n) => n.toString(16).padStart(2, "0")).join("");
}
