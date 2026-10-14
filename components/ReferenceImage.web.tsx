import type { ReferenceImageProps } from "./ReferenceImage";

export const supportsImageAdjustments =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports(
    "filter",
    "grayscale(1) contrast(1.2) brightness(1.1) saturate(0.8) blur(0.7px)",
  );

export default function ReferenceImage({
  uri,
  label,
  filter,
  onError,
}: ReferenceImageProps) {
  return (
    <img
      src={uri}
      alt={label}
      onError={onError}
      draggable={false}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "contain",
        filter,
      }}
    />
  );
}
