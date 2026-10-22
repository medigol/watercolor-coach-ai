import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { toneSample, type ToneSample } from "../shared/imageTone";
import { validSize, type ImageSize } from "../shared/imageGeometry";

/** One transient raster read per source/dimension identity. No fetch API, canvas
 * export, network service, model, storage or DB. A tainted/expired image is safe
 * to omit. Existing source display remains available on native. */
export function useImageTone(
  uri?: string,
  size?: ImageSize | null,
): ToneSample | null {
  const [current, setCurrent] = useState<{
    uri: string;
    width: number;
    height: number;
    sample: ToneSample;
  } | null>(null);
  const width = size?.width,
    height = size?.height;
  useEffect(() => {
    setCurrent(null);
    if (
      Platform.OS !== "web" ||
      !uri ||
      !validSize(size) ||
      size.width * size.height > 16_000_000
    )
      return;
    let active = true;
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = uri;
    void image
      .decode()
      .then(() => {
        if (
          !active ||
          image.naturalWidth !== width ||
          image.naturalHeight !== height
        )
          return;
        const scale = Math.min(
          1,
          256 / Math.max(image.naturalWidth, image.naturalHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        try {
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const sample = toneSample(
            ctx.getImageData(0, 0, canvas.width, canvas.height).data,
            canvas.width,
            canvas.height,
          );
          if (sample && active)
            setCurrent({
              uri,
              width: image.naturalWidth,
              height: image.naturalHeight,
              sample,
            });
        } finally {
          canvas.width = canvas.height = 1;
        }
      })
      .catch(() => {
        /* Cross-origin/decoding limitations must not break a result. */
      });
    return () => {
      active = false;
      image.src = "";
    };
  }, [uri, width, height]);
  return current &&
    current.uri === uri &&
    current.width === width &&
    current.height === height
    ? current.sample
    : null;
}
