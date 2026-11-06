import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../providers/AuthProvider";
import {
  intentions,
  isId,
  type ReferenceRecord,
  statusAdvice,
} from "../shared/referenceStudio";
import { referenceBytes, referenceRecord } from "../lib/referenceStudioClient";
import { downloadBlob } from "../lib/referenceCanvas.web";
import StudioShell from "./reference-studio/StudioShell";
import StudioImage from "./reference-studio/StudioImage";
import PlanningTools from "./reference-studio/PlanningTools";
function guidance(r: ReferenceRecord): string[] {
  const d = r.request_json.direction;
  return [
    "Choose the area that carries your intended emphasis. Compare its surrounding value/chroma/edge relationships before adding contrast; a central subject can work well.",
    "Make a small three-value pencil or paint study. Join neighbouring shapes that can share a value; reserve the principal paper lights deliberately rather than outlining every object.",
    d.goal === "atmosphere" || d.mood === "quiet"
      ? "Test quieter contrast and chroma in supporting distant masses. Keep the intended focal relationship readable; distance is not a rule that every background must be lighter."
      : "Test a light first wash on scrap. Use a round or flat brush with enough capacity for the chosen shape, and premix enough colour to avoid emergency mixing at a drying edge.",
    d.colour === "warmer"
      ? "Compare a warm and a cooler version of the same small wash with familiar pigments. Keep dry value comparable so temperature, rather than extra darkness, makes the difference."
      : d.colour === "cooler"
      ? "Compare a cooler supporting mixture with your main subject colour. Keep chroma and dry value under control; avoid making all shadows the same cold blue."
      : "Start with a few familiar pigments that can make your observed major colours. Test mixtures dry; pigment names or exact recipes cannot be inferred from this generated reference.",
    d.preserve.geometry
      ? "Block in the main building/object proportions before washing. Check converging edge families against the original photo; generated architecture and faces require your inspection."
      : "Check the main proportions against the original, then decide which secondary boundaries can be simplified without changing the subject.",
    "For a hard boundary, work against a dry neighbouring passage. For a soft transition, test on an evenly damp patch without standing water. Do not re-wet a partly drying wash to force a correction; use a fresh test.",
    "Establish connected large masses before small accents. Add a few sharper/darker marks only where they serve your intention; a pointed round can place them without scrubbing. Let layers dry before judging their values or glazing.",
    "Compare the dry study with your intention. Stop if further marks would only repeat information. Water, brush load, paper sizing and climate change the result; the image proves no physical painting process.",
  ];
}
export default function ReferenceStudioResult({ id }: { id: string }) {
  const { session } = useAuth(), owner = session?.user.id;
  const [record, setRecord] = useState<ReferenceRecord>(),
    [source, setSource] = useState<Blob>(),
    [input, setInput] = useState<Blob>(),
    [output, setOutput] = useState<Blob>(),
    [attempt, setAttempt] = useState(0),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [loaded, setLoaded] = useState("");
  const key = `${owner}/${id}/${attempt}`;
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setRecord(undefined);
    setSource(undefined);
    setInput(undefined);
    setOutput(undefined);
    (async () => {
      try {
        if (!owner || !isId(id)) throw Error("Invalid saved reference.");
        const r = await referenceRecord(owner, id);
        const original = await referenceBytes(owner, r, "source"),
          prepared = await referenceBytes(owner, r, "input");
        const edited = r.status === "completed"
          ? await referenceBytes(owner, r, "output")
          : undefined;
        if (active) {
          setRecord(r);
          setSource(original);
          setInput(prepared);
          setOutput(edited);
        }
      } catch (e) {
        if (active) {
          setError(
            e instanceof Error ? e.message : "Saved reference unavailable.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setLoaded(key);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [owner, id, attempt, key]);
  if (loading || loaded !== key) {
    return (
      <StudioShell>
        <h1>Opening your reference</h1>
        <p role="status">
          Checking this saved request. No generation is started on page load.
        </p>
      </StudioShell>
    );
  }
  if (error || !record) {
    return (
      <StudioShell>
        <h1>Reference request</h1>
        <p role="alert">{error}</p>
        <p>
          No automatic retry or new paid generation was made. A missing request
          may mean upload or reservation did not finish; ask the owner to
          reconcile before another paid attempt.
        </p>
        <button onClick={() => setAttempt((x) => x + 1)}>
          Check status again
        </button>
        <button onClick={() => router.push("/(tabs)/artworks")}>
          My Artworks
        </button>
      </StudioShell>
    );
  }
  const d = record.request_json.direction,
    notes = guidance(record),
    p = record.request_json.pixels;
  return (
    <StudioShell>
      <h1>Your painting reference</h1>
      <p role="status" className="rs-status">{statusAdvice[record.status]}</p>
      {record.status !== "completed" && (
        <button onClick={() => setAttempt((x) => x + 1)}>Check status</button>
      )}
      {output
        ? (
          <>
            <section className="rs-panel">
              <h2>Improved reference</h2>
              <StudioImage
                blob={output}
                label="AI-edited reference — inspect fidelity before using it for painting"
              />
              <div className="rs-actions">
                <button
                  className="rs-primary"
                  onClick={() =>
                    downloadBlob(output, "improved-painting-reference.png")}
                >
                  Export improved reference PNG
                </button>
                <button onClick={() => router.push("/(tabs)/artworks")}>
                  Saved privately · My Artworks
                </button>
                <button
                  onClick={() =>
                    router.push({
                      pathname: "/upload/create-reference",
                      params: { from: record.id },
                    })}
                >
                  Refine this reference · separate paid attempt
                </button>
              </div>
              <p className="rs-muted">
                One generated image, not a certified improvement or a record of
                a physical painting. Check protected objects, faces,
                architecture and highlights against the original.
              </p>
            </section>
            <section className="rs-panel">
              <h2>Before / after</h2>
              {record.request_json.parentId && (
                <button
                  onClick={() =>
                    router.push({
                      pathname: "/result/create-reference",
                      params: { generation: record.request_json.parentId! },
                    })}
                >
                  View parent reference and its original
                </button>
              )}
              <div className="rs-compare">
                {source && (
                  <StudioImage
                    blob={source}
                    label={record.request_json.parentId
                      ? "Selected parent reference — unchanged"
                      : "Original photograph — unchanged"}
                  />
                )}
                <StudioImage
                  blob={output}
                  label="Improved reference — generated"
                />
              </div>
              {input && (
                <details>
                  <summary>See the prepared input sent for editing</summary>
                  <StudioImage
                    blob={input}
                    label="Prepared input after your local crop, rotation and pixel adjustments"
                  />
                </details>
              )}
            </section>
          </>
        )
        : (
          <p>
            The transformed image is not available yet. Keep the same request
            identity while resolving its status.
          </p>
        )}
      <section className="rs-panel">
        <h2>What changed?</h2>
        <h3>Applied before AI editing</h3>
        <p>
          {p.rotate}° additional rotation after orientation correction; crop
          left {Math.round(p.crop.x * 100)}%, top{" "}
          {Math.round(p.crop.y * 100)}%, width{" "}
          {Math.round(p.crop.width * 100)}%, height{" "}
          {Math.round(p.crop.height * 100)}%. Brightness{" "}
          {p.brightness}, contrast {p.contrast}, saturation{" "}
          {p.saturation}, warm/cool channel shift{" "}
          {p.temperature}. These are recorded deterministic operations.
        </p>
        <h3>Requested, awaiting your comparison</h3>
        <p>
          {intentions[d.goal]} · {d.strength}. Permitted areas:{" "}
          {d.changes.length
            ? d.changes.map((v) => v.replaceAll("-", " ")).join(", ")
            : "preserve the scene"}. Colour: {d.colour}; detail:{" "}
          {d.detail.replaceAll("-", " ")}; mood: {d.mood}.
        </p>
        <p>
          Protected: {Object.entries(d.preserve).filter(([k, v]) =>
            k !== "details" && v === true
          ).map(([k]) =>
            k
          ).join(", ")}. {d.preserve.details}
        </p>
        {d.instruction && <p>Your instruction: {d.instruction}</p>}
        <p className="rs-muted">
          These describe intentions, not verified completed edits. No extra paid
          vision analysis has been run. Compare for missing/duplicated objects,
          altered faces, inconsistent windows or perspective, and unintended
          cropping. Reject an unsuitable result.
        </p>
      </section>
      {output && (
        <>
          <PlanningTools blob={output} />
          <section className="rs-panel">
            <h2>Take the reference to paper</h2>
            <p className="rs-muted">
              Guidance follows your intention and a controlled painting
              workflow; it does not assert how the generated image was made.
            </p>
            <ol>
              {notes.map((n) => (
                <li key={n}>
                  <p>{n}</p>
                </li>
              ))}
            </ol>
            <button
              onClick={() =>
                downloadBlob(
                  new Blob([
                    `PAINTING REFERENCE PLAN\n${
                      intentions[d.goal]
                    }\nRequested changes, not verified edits: ${d.instruction}\n\n${
                      notes.join("\n\n")
                    }`,
                  ], { type: "text/plain;charset=utf-8" }),
                  "painting-reference-plan.txt",
                )}
            >
              Export concise painting plan
            </button>
          </section>
        </>
      )}
      {source && (
        <button
          onClick={() =>
            downloadBlob(
              source,
              `original-photo.${
                record.request_json.source.path.endsWith(".jpg") ? "jpg" : "png"
              }`,
            )}
        >
          {record.request_json.parentId
            ? "Export unchanged parent reference"
            : "Export unchanged original"}
        </button>
      )}
    </StudioShell>
  );
}
