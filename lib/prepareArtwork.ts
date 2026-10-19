import { Platform } from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import {
  imageHeader,
  orientedDimensions,
  cropPixels,
  outputDimensions,
  boundaryProposal,
  preparationLimits,
  type ImageHeader,
} from "../shared/artworkPreparation";
import type { NormalizedRect } from "../shared/imageGeometry";
import type { ArtworkImage } from "./artworks";
export interface ArtworkPreparation {
  uri: string;
  width: number;
  height: number;
  proposal: NormalizedRect | null;
  export(region: NormalizedRect): Promise<ArtworkImage>;
  dispose(): void;
}
const tooLarge = "Choose an image smaller than 10 MB, then try again.";
async function readSource(image: ArtworkImage) {
  if (image.fileSize !== undefined && image.fileSize > preparationLimits.bytes)
    throw new Error(tooLarge);
  const r = await fetch(image.uri);
  if (!r.ok)
    throw new Error(
      "This image could not be opened. Choose another photo or scan.",
    );
  if (Number(r.headers.get("content-length")) > preparationLimits.bytes)
    throw new Error(tooLarge);
  const bytes = new Uint8Array(await r.arrayBuffer());
  return { bytes, header: imageHeader(bytes) };
}
function checkedOutput(
  bytes: Uint8Array,
  uri: string,
  width: number,
  height: number,
): ArtworkImage {
  const h = imageHeader(bytes);
  if (h.width !== width || h.height !== height)
    throw new Error(
      "The prepared image size did not match the preview. Choose it again.",
    );
  return {
    uri,
    bytes,
    width,
    height,
    mimeType: h.mime,
    fileSize: bytes.length,
  };
}
function blobBytes(b: Blob) {
  return b.arrayBuffer().then((a) => new Uint8Array(a));
}
const canvasBlob = (c: HTMLCanvasElement, type = "image/png") =>
  new Promise<Blob>((resolve, reject) =>
    c.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("This image could not be prepared.")),
      type,
      0.96,
    ),
  );
function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
async function webPreparation(
  bytes: Uint8Array,
  header: ImageHeader,
): Promise<ArtworkPreparation> {
  const blob = new Blob([bytes.slice().buffer], { type: header.mime }),
    uri = URL.createObjectURL(blob);
  let drawable: CanvasImageSource;
  try {
    const im = new window.Image();
    im.src = uri;
    await im.decode();
    const expected = orientedDimensions(header);
    if (
      im.naturalWidth !== expected.width ||
      im.naturalHeight !== expected.height
    )
      throw new Error(
        "Image orientation could not be verified. Export an upright copy and choose it again.",
      );
    drawable = im;
    const { width, height } = expected;
    const sample = canvas(96, 96),
      ctx = sample.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("This browser could not prepare the image.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 96, 96);
    ctx.drawImage(drawable, 0, 0, 96, 96);
    const proposal = boundaryProposal(
      ctx.getImageData(0, 0, 96, 96).data,
      96,
      96,
    );
    sample.width = sample.height = 1;
    const exports: string[] = [];
    let disposed = false;
    return {
      uri,
      width,
      height,
      proposal,
      dispose() {
        disposed = true;
        URL.revokeObjectURL(uri);
        exports.forEach((u) => URL.revokeObjectURL(u));
      },
      async export(region) {
        if (disposed)
          throw new Error("This image is no longer selected. Choose it again.");
        const p = cropPixels(region, { width, height }),
          size = outputDimensions(p),
          c = canvas(size.width, size.height),
          cx = c.getContext("2d");
        if (!cx) throw new Error("This browser could not prepare the image.");
        // White matte matches paper; no hue/value/contrast edits. drawImage uses
        // oriented natural pixels, independent of screen scale, scroll or DPR.
        cx.fillStyle = "#fff";
        cx.fillRect(0, 0, c.width, c.height);
        cx.imageSmoothingQuality = "high";
        cx.drawImage(
          drawable,
          p.originX,
          p.originY,
          p.width,
          p.height,
          0,
          0,
          c.width,
          c.height,
        );
        const b = await canvasBlob(
          c,
          header.mime === "image/jpeg" ? "image/jpeg" : "image/png",
        );
        c.width = c.height = 1;
        if (b.size > preparationLimits.bytes) throw new Error(tooLarge);
        const data = await blobBytes(b);
        // Encoding and byte reads can finish after navigating away or replacing
        // the source. Do not resurrect a disposed private blob URL.
        if (disposed)
          throw new Error("This image is no longer selected. Choose it again.");
        const output = checkedOutput(data, "", size.width, size.height);
        const u = URL.createObjectURL(b);
        // A confirmed replacement is a new preparation. Keep only its output;
        // unconfirmed edits still retain the current URI for safe cancellation.
        exports.forEach((previous) => URL.revokeObjectURL(previous));
        exports.length = 0;
        exports.push(u);
        return { ...output, uri: u };
      },
    };
  } catch (e) {
    URL.revokeObjectURL(uri);
    throw e;
  }
}
function decodeBase64(s: string) {
  const binary = atob(s),
    b = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) b[i] = binary.charCodeAt(i);
  return b;
}
async function nativePreparation(
  image: ArtworkImage,
  header: ImageHeader,
): Promise<ArtworkPreparation> {
  // Expo 54 normalizes EXIF on load. Do not apply EXIF a second time.
  const normalized = await manipulateAsync(image.uri, [], {
    format: SaveFormat.PNG,
  });
  const expected = orientedDimensions(header);
  if (
    normalized.width !== expected.width ||
    normalized.height !== expected.height
  )
    throw new Error(
      "Image orientation could not be verified. Choose an upright copy.",
    );
  return {
    uri: normalized.uri,
    width: normalized.width,
    height: normalized.height,
    proposal: null,
    dispose() {
      /* Expo cache files are local only; never uploaded as redundant originals. */
    },
    async export(region) {
      const crop = cropPixels(region, normalized),
        size = outputDimensions(crop);
      const actions: Parameters<typeof manipulateAsync>[1] = [{ crop }];
      if (size.width !== crop.width || size.height !== crop.height)
        actions.push({ resize: size });
      const out = await manipulateAsync(normalized.uri, actions, {
        format: SaveFormat.PNG,
        base64: true,
        compress: 1,
      });
      if (
        !out.base64 ||
        out.base64.length > Math.ceil((preparationLimits.bytes * 4) / 3) + 4
      )
        throw new Error(tooLarge);
      return checkedOutput(
        decodeBase64(out.base64),
        out.uri,
        out.width,
        out.height,
      );
    },
  };
}
export async function prepareArtwork(
  image: ArtworkImage,
): Promise<ArtworkPreparation> {
  const { bytes, header } = await readSource(image);
  return Platform.OS === "web"
    ? webPreparation(bytes, header)
    : nativePreparation(image, header);
}

/** Web's general Expo picker decodes metadata before returning an asset. For
 * this path use the file input directly so resource headers precede any decode. */
export function pickWebArtwork(): Promise<
  { image: ArtworkImage; dispose(): void } | undefined
> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.style.display = "none";
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("focus", focused);
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        resolve(undefined);
        return;
      }
      const uri = URL.createObjectURL(file);
      resolve({
        image: { uri, fileSize: file.size, mimeType: file.type },
        dispose: () => URL.revokeObjectURL(uri),
      });
    };
    // `cancel` covers current browsers; focus is the older-picker fallback.
    const focused = () => {
      setTimeout(finish, 250);
    };
    input.addEventListener("change", finish, { once: true });
    input.addEventListener("cancel", finish, { once: true });
    window.addEventListener("focus", focused, { once: true });
    document.body.appendChild(input);
    input.click();
  });
}
