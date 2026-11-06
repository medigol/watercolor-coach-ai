import { imageHeader } from "../shared/referenceImage";
import { type PixelSettings, validPixels } from "../shared/referenceStudio";
import { adjustPixels, valueStudy } from "../shared/referencePixels";
export type Photo = {
  file: File;
  bytes: Uint8Array;
  header: ReturnType<typeof imageHeader>;
  canvas: HTMLCanvasElement;
};
export function pngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(Error("Could not export pixels.")),
      "image/png",
    )
  );
}
export async function readPhoto(file: File): Promise<Photo> {
  if (file.size > 10 * 1024 * 1024) {
    throw Error("Choose a JPEG or PNG smaller than 10 MB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer()),
    header = imageHeader(bytes);
  const bitmap = await createImageBitmap(
    new Blob([bytes.slice().buffer], { type: header.mime }),
    { imageOrientation: "from-image" },
  ).catch(() => {
    throw Error("This photo could not be decoded. Choose another JPEG or PNG.");
  });
  if (bitmap.width * bitmap.height !== header.width * header.height) {
    bitmap.close();
    throw Error("Image dimensions are inconsistent.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw Error("Pixel processing is unavailable in this browser.");
  }
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return { file, bytes, header, canvas };
}
export async function preparePhoto(
  photo: Photo,
  s: PixelSettings,
): Promise<
  { blob: Blob; canvas: HTMLCanvasElement; width: number; height: number }
> {
  if (!validPixels(s)) throw Error("Keep the crop within the photo.");
  const rotated = document.createElement("canvas"),
    side = s.rotate === 90 || s.rotate === 270;
  rotated.width = side ? photo.canvas.height : photo.canvas.width;
  rotated.height = side ? photo.canvas.width : photo.canvas.height;
  const r = rotated.getContext("2d")!;
  r.translate(rotated.width / 2, rotated.height / 2);
  r.rotate(s.rotate * Math.PI / 180);
  r.drawImage(photo.canvas, -photo.canvas.width / 2, -photo.canvas.height / 2);
  const crop = s.crop,
    w = rotated.width * crop.width,
    h = rotated.height * crop.height,
    scale = Math.min(1, 1536 / Math.max(w, h));
  if (w / h < 1 / 3 || w / h > 3) {
    throw Error(
      "Crop to an aspect ratio between 1:3 and 3:1 before generation.",
    );
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(16, Math.round(w * scale));
  canvas.height = Math.max(16, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    rotated,
    crop.x * rotated.width,
    crop.y * rotated.height,
    w,
    h,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixels.data.set(adjustPixels(pixels.data, s));
  ctx.putImageData(pixels, 0, 0);
  rotated.width = rotated.height = 1;
  return {
    blob: await pngBlob(canvas),
    canvas,
    width: canvas.width,
    height: canvas.height,
  };
}
export async function planningBlob(
  blob: Blob,
  groups: 3 | 5,
  shapes: boolean,
): Promise<{ blob: Blob; fractions: number[] }> {
  const bitmap = await createImageBitmap(blob),
    scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const study = valueStudy(
    pixels.data,
    canvas.width,
    canvas.height,
    groups,
    shapes ? Math.max(2, Math.round(canvas.width / 96)) : 1,
  );
  pixels.data.set(study.pixels);
  ctx.putImageData(pixels, 0, 0);
  return { blob: await pngBlob(canvas), fractions: study.fractions };
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
