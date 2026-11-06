import { useEffect, useState } from "react";
import { downloadBlob, planningBlob } from "../../lib/referenceCanvas.web";
import StudioImage from "./StudioImage";
export default function PlanningTools({ blob }: { blob: Blob }) {
  const [groups, setGroups] = useState<3 | 5>(3),
    [shapes, setShapes] = useState(false),
    [result, setResult] = useState<{ blob: Blob; fractions: number[] }>(),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setResult(undefined);
    setError("");
    planningBlob(blob, groups, shapes).then((r) => {
      if (alive) setResult(r);
    }).catch(() => {
      if (alive) {
        setError(
          "The planning pixels could not be prepared. Your reference is unchanged.",
        );
      }
    });
    return () => {
      alive = false;
    };
  }, [blob, groups, shapes]);
  return (
    <section className="rs-panel" aria-labelledby="planning-title">
      <h2 id="planning-title">Plan the large values</h2>
      <p>
        Compare the main light, middle and dark areas before choosing a focal
        contrast. These are approximate pixel groups, not a judgement of
        composition.
      </p>
      <div className="rs-actions">
        {([3, 5] as const).map((n) => (
          <button
            key={n}
            aria-pressed={groups === n}
            onClick={() => setGroups(n)}
          >
            {n} value groups
          </button>
        ))}
      </div>
      <label className="rs-check">
        <input
          type="checkbox"
          checked={shapes}
          onChange={(e) => setShapes(e.target.checked)}
        />Group small pixel areas into a broad shape study
      </label>
      {error ? <p role="alert">{error}</p> : result
        ? (
          <>
            <StudioImage
              blob={result.blob}
              label={`${groups}-value ${
                shapes ? "block-grouped shape" : "tonal"
              } study — computed from the selected reference`}
            />
            <p className="rs-muted">
              Dark to light:{" "}
              {result.fractions.map((v) => Math.round(v * 100) + "%").join(
                " · ",
              )}{" "}
              of pixels. Lightness thresholds and block averaging are
              approximate; they do not recognise objects, identify a focal point
              or remove distractions.
            </p>
            <button
              onClick={() =>
                downloadBlob(
                  result.blob,
                  `reference-${groups}-value${
                    shapes ? "-shape" : ""
                  }-study.png`,
                )}
            >
              Export this planning PNG
            </button>
          </>
        )
        : <p role="status">Computing planning pixels locally…</p>}
    </section>
  );
}
