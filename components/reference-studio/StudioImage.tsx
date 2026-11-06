import { useEffect, useState } from "react";
export default function StudioImage(
  { blob, label }: { blob: Blob; label: string },
) {
  const [url, setUrl] = useState(""), [failed, setFailed] = useState(false);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    setFailed(false);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return (
    <figure>
      {failed
        ? (
          <p role="alert">
            This image could not be displayed. Keep the original and check the
            file before painting.
          </p>
        )
        : url
        ? <img src={url} alt={label} onError={() => setFailed(true)} />
        : <p role="status">Preparing image…</p>}
      <figcaption>{label}</figcaption>
    </figure>
  );
}
