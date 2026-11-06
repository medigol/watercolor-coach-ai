import jpeg from "npm:jpeg-js@0.4.4";
// @ts-types="npm:@types/pngjs@6.0.5"
import { PNG } from "npm:pngjs@7.0.0";
import { Buffer } from "node:buffer";
import { imageHeader } from "../../../shared/referenceImage.ts";
export function decodeReference(
  bytes: Uint8Array,
): { width: number; height: number } {
  const h = imageHeader(bytes);
  const decoded = h.mime === "image/png"
    ? PNG.sync.read(Buffer.from(bytes), { checkCRC: true })
    : jpeg.decode(bytes, {
      useTArray: true,
      maxResolutionInMP: 8,
      maxMemoryUsageInMB: 100,
      tolerantDecoding: false,
    });
  if (
    decoded.width !== h.width || decoded.height !== h.height ||
    decoded.data.length !== h.width * h.height * 4
  ) throw Error("Image could not be decoded.");
  return { width: decoded.width, height: decoded.height };
}
