import type { YouTubeFrameProps } from "./YouTubeFrame";
export default function YouTubeFrame({
  src,
  title,
  onError,
}: YouTubeFrameProps) {
  return (
    <iframe
      title={title}
      src={src}
      width="100%"
      height="100%"
      onError={onError}
      allow="encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      style={{
        border: 0,
        display: "block",
        width: "100%",
        aspectRatio: "16/9",
        minHeight: 200,
      }}
    />
  );
}
