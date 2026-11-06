import { useCallback, useEffect, useRef, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useAuth } from "../providers/AuthProvider";
import {
  changes,
  defaultDirection,
  defaultPixels,
  type Direction,
  intentions,
  isId,
  type PixelSettings,
  referenceVersion,
  type StudioRequest,
  validDirection,
  validPixels,
} from "../shared/referenceStudio";
import { imageHash } from "../shared/referenceImage";
import {
  downloadBlob,
  type Photo,
  preparePhoto,
  readPhoto,
} from "../lib/referenceCanvas.web";
import {
  referenceBytes,
  referenceRecord,
  studioCapabilities,
  studioKey,
  submitReference,
} from "../lib/referenceStudioClient";
import StudioShell from "./reference-studio/StudioShell";
import StudioImage from "./reference-studio/StudioImage";
import PlanningTools from "./reference-studio/PlanningTools";
const preserveLabels = {
  subject: "Main subject",
  geometry: "Perspective, proportions and major shapes",
  identity: "Recognisable people and identity",
  lights: "Important highlights",
  colours: "Important colours",
};
const changeLabels = {
  framing: "Framing and grouping",
  colour: "Colour relationships",
  background: "Background detail",
  values: "Value organisation",
  "secondary-objects": "Minor supporting objects",
};
export default function ReferenceStudio() {
  const { session } = useAuth(), owner = session?.user.id;
  const params = useLocalSearchParams<{ from?: string }>();
  const [photo, setPhoto] = useState<Photo>(),
    [prepared, setPrepared] = useState<
      Awaited<ReturnType<typeof preparePhoto>>
    >(),
    [direction, setDirection] = useState<Direction>(
      structuredClone(defaultDirection),
    ),
    [pixels, setPixels] = useState<PixelSettings>(
      structuredClone(defaultPixels),
    );
  const [cap, setCap] = useState({ enabled: false, remaining: 0 }),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [receipt, setReceipt] = useState<string>(),
    [parent, setParent] = useState<string | null>(null),
    [restored, setRestored] = useState(false),
    [storageOK, setStorageOK] = useState(true);
  const picker = useRef<HTMLInputElement>(null),
    running = useRef(false),
    alive = useRef(true),
    selection = useRef(0),
    status = useRef<HTMLParagraphElement>(null);
  const focused = useRef(true);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => {
      focused.current = false;
    };
  }, []));
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!owner) return;
    try {
      const raw = sessionStorage.getItem(studioKey(owner));
      if (raw) {
        const v = JSON.parse(raw);
        if (validDirection(v.direction)) setDirection(v.direction);
        if (validPixels(v.pixels)) setPixels(v.pixels);
        if (isId(v.receipt)) setReceipt(v.receipt);
      }
    } catch {
      setStorageOK(false);
    }
    setRestored(true);
    studioCapabilities(owner).then((v) => {
      if (alive.current) setCap(v);
    }).catch(() => {
      if (alive.current) setCap({ enabled: false, remaining: 0 });
    });
  }, [owner]);
  useEffect(() => {
    if (!owner || !restored) return;
    try {
      sessionStorage.setItem(
        studioKey(owner),
        JSON.stringify({ direction, pixels, receipt }),
      );
      setStorageOK(true);
    } catch {
      setStorageOK(false);
    }
  }, [owner, restored, direction, pixels, receipt]);
  async function select(file: File, from: string | null = null) {
    const revision = ++selection.current;
    setMessage("");
    setPrepared(undefined);
    setPhoto(undefined);
    setConsent(false);
    try {
      const p = await readPhoto(file);
      if (alive.current && revision === selection.current) {
        setPhoto(p);
        setPixels(structuredClone(defaultPixels));
        setParent(from);
      }
    } catch (e) {
      if (alive.current && revision === selection.current) {
        setMessage(e instanceof Error ? e.message : "Choose another photo.");
      }
    }
  }
  useEffect(() => {
    if (!owner || !isId(params.from)) return;
    let active = true;
    const id = params.from;
    (async () => {
      try {
        const r = await referenceRecord(owner, id);
        if (r.status !== "completed") {
          throw Error("Only a completed reference can be refined.");
        }
        const b = await referenceBytes(owner, r, "output");
        if (active) {
          await select(
            new File([b], "saved-reference.png", { type: "image/png" }),
            id,
          );
        }
      } catch (e) {
        if (active) {
          setMessage(
            e instanceof Error ? e.message : "Saved reference unavailable.",
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [owner, params.from]);
  useEffect(() => {
    if (!photo) return;
    let active = true;
    setPrepared(undefined);
    const timer = setTimeout(() => {
      preparePhoto(photo, pixels).then((v) => {
        if (active) setPrepared(v);
      }).catch((e) => {
        if (active) {
          setMessage(e instanceof Error ? e.message : "Preparation failed.");
        }
      });
    }, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [photo, pixels]);
  const openReceipt = (id: string) =>
    router.push({
      pathname: "/result/create-reference",
      params: { generation: id },
    });
  async function generate() {
    if (
      !owner || !photo || !prepared || !consent || !cap.enabled || !storageOK ||
      receipt || running.current
    ) return;
    running.current = true;
    setBusy(true);
    setMessage("Preparing one private image-edit request…");
    const id = crypto.randomUUID();
    try {
      const source = photo.bytes,
        input = new Uint8Array(await prepared.blob.arrayBuffer());
      const request: StudioRequest = {
        version: referenceVersion,
        id,
        ownerId: owner,
        parentId: parent,
        source: {
          path: `${owner}/${id}/source.${
            photo.header.mime === "image/png" ? "png" : "jpg"
          }`,
          sha256: await imageHash(source),
          width: photo.header.width,
          height: photo.header.height,
          bytes: source.length,
        },
        input: {
          path: `${owner}/${id}/input.png`,
          sha256: await imageHash(input),
          width: prepared.width,
          height: prepared.height,
          bytes: input.length,
        },
        direction: structuredClone(direction),
        pixels: structuredClone(pixels),
        paidConsent: true,
      };
      sessionStorage.setItem(
        studioKey(owner),
        JSON.stringify({ direction, pixels, receipt: id }),
      );
      setReceipt(id);
      setMessage(
        "Generating one improved reference. You can return to this request; do not start another.",
      );
      status.current?.focus();
      await submitReference(owner, request, source, input);
      if (alive.current && focused.current) openReceipt(id);
    } catch (e) {
      if (alive.current) {
        setMessage(
          e instanceof Error
            ? e.message
            : "Request not confirmed. Check its status before another edit.",
        );
      }
    } finally {
      running.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <StudioShell>
      <h1>Create a painting reference</h1>
      <p>
        Keep what matters in your photograph. Prepare the large relationships,
        then request one purposeful image edit.
      </p>
      <div className="rs-actions">
        <button onClick={() => router.push("/(tabs)/artworks")}>
          Saved references and artworks
        </button>
        <button
          onClick={() =>
            router.push({
              pathname: "/upload/create-reference",
              params: { legacy: "1" },
            })}
        >
          Text-only painting plan
        </button>
      </div>
      {parent && (
        <p className="rs-status">
          Refining a saved reference. This will be a separate paid attempt; its
          parent and original stay unchanged.
        </p>
      )}
      <div className="rs-grid">
        <section>
          <div className="rs-panel">
            <h2>{parent ? "1. Selected reference" : "1. Your photograph"}</h2>
            <p className="rs-muted">
              JPEG or PNG · up to 10 MB and 8 megapixels · 16–4096 px per side.
              Orientation is corrected for processing; original bytes are kept
              unchanged.
            </p>
            <input
              ref={picker}
              className="rs-hidden"
              type="file"
              accept="image/jpeg,image/png"
              aria-label="Photo file"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void select(f);
                e.target.value = "";
              }}
            />
            <button onClick={() => picker.current?.click()} disabled={busy}>
              Choose photo
            </button>
            {photo && (
              <>
                <StudioImage
                  blob={photo.file}
                  label={parent
                    ? "Selected parent reference — unchanged"
                    : "Original photograph — unchanged"}
                />
                <button
                  onClick={() =>
                    downloadBlob(
                      photo.file,
                      `original-photo.${
                        photo.header.mime === "image/png" ? "png" : "jpg"
                      }`,
                    )}
                >
                  {parent
                    ? "Export unchanged parent reference"
                    : "Export original"}
                </button>
              </>
            )}
          </div>
          {photo && (
            <div className="rs-panel">
              <h2>Prepared input</h2>
              {prepared
                ? (
                  <>
                    <StudioImage
                      blob={prepared.blob}
                      label="Prepared reference input — local pixel adjustments, not AI transformation"
                    />
                    <button
                      onClick={() =>
                        downloadBlob(prepared.blob, "prepared-reference.png")}
                    >
                      Export prepared PNG
                    </button>
                  </>
                )
                : <p role="status">Preparing pixels locally…</p>}
              <details>
                <summary>Crop, rotation and colour preparation</summary>
                <p className="rs-muted">
                  Crop percentages refer to the rotated photo. Check that
                  protected subjects remain inside it. These local edits alter
                  pixels; they do not remove objects.
                </p>
                <button
                  disabled={busy}
                  onClick={() =>
                    setPixels((s) => ({
                      ...s,
                      rotate:
                        ((s.rotate + 90) % 360) as PixelSettings["rotate"],
                      crop: { x: 0, y: 0, width: 1, height: 1 },
                    }))}
                >
                  Rotate 90°
                </button>
                <div className="rs-number-grid">
                  {(["x", "y", "width", "height"] as const).map((k) => (
                    <label key={k}>
                      <span>
                        Crop {k === "x" ? "left" : k === "y" ? "top" : k} (%)
                      </span>
                      <input
                        type="number"
                        min={k === "x" || k === "y" ? 0 : 10}
                        max={100}
                        step={1}
                        value={Math.round(pixels.crop[k] * 100)}
                        disabled={busy}
                        onChange={(e) => {
                          const v = e.currentTarget.valueAsNumber;
                          if (Number.isFinite(v)) {
                            setPixels((s) => ({
                              ...s,
                              crop: { ...s.crop, [k]: v / 100 },
                            }));
                          }
                        }}
                      />
                    </label>
                  ))}
                </div>
                {([
                  "brightness",
                  "contrast",
                  "saturation",
                  "temperature",
                ] as const).map((k) => (
                  <label key={k}>
                    <span>
                      {k === "temperature"
                        ? "Warm / cool channel shift (approximate)"
                        : k}
                    </span>
                    <input
                      type="range"
                      aria-label={k}
                      min={k === "brightness"
                        ? -.3
                        : k === "temperature"
                        ? -.25
                        : k === "saturation"
                        ? 0
                        : .5}
                      max={k === "brightness"
                        ? .3
                        : k === "temperature"
                        ? .25
                        : 1.5}
                      step={.01}
                      value={pixels[k]}
                      disabled={busy}
                      onChange={(e) => {
                        const value = e.currentTarget.valueAsNumber;
                        setPixels((s) => ({ ...s, [k]: value }));
                      }}
                    />
                  </label>
                ))}
                <button
                  disabled={busy}
                  onClick={() => setPixels(structuredClone(defaultPixels))}
                >
                  Reset preparation
                </button>
              </details>
            </div>
          )}
        </section>
        <section className="rs-panel">
          <h2>2. Your artistic intention</h2>
          <fieldset disabled={busy}>
            <label>
              <span>What should this reference help you do?</span>
              <select
                value={direction.goal}
                onChange={(e) => {
                  const goal = e.target.value as Direction["goal"];
                  const permitted = goal === "composition"
                    ? ["framing", "background"] as const
                    : goal === "colour"
                    ? ["colour"] as const
                    : goal === "focal"
                    ? ["values", "background"] as const
                    : goal === "expressive"
                    ? ["colour", "values", "background"] as const
                    : ["background"] as const;
                  setDirection((s) => ({
                    ...s,
                    goal,
                    changes: [...permitted],
                  }));
                }}
              >
                {Object.entries(intentions).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Change strength</span>
              <select
                value={direction.strength}
                onChange={(e) =>
                  setDirection((s) => ({
                    ...s,
                    strength: e.target.value as Direction["strength"],
                  }))}
              >
                <option value="subtle">
                  Subtle — preserve almost all subject relationships
                </option>
                <option value="balanced">
                  Balanced — noticeable, purposeful changes
                </option>
                <option value="creative">
                  Creative — stronger reinterpretation of the core subject
                </option>
              </select>
            </label>
            <p className="rs-muted">
              Strength is a qualitative request, not a guarantee of exact
              fidelity. Permitted changes:{" "}
              {direction.changes.map((c) => changeLabels[c]).join(", ") ||
                "preserve the scene"}. You can revise these below.
            </p>
            <details>
              <summary>What to preserve and change</summary>
              <fieldset>
                <legend>Protect</legend>
                {(Object.keys(
                  preserveLabels,
                ) as (keyof typeof preserveLabels)[]).map((k) => (
                  <label className="rs-check" key={k}>
                    <input
                      type="checkbox"
                      checked={direction.preserve[k]}
                      onChange={(e) =>
                        setDirection((s) => ({
                          ...s,
                          preserve: { ...s.preserve, [k]: e.target.checked },
                        }))}
                    />
                    {preserveLabels[k]}
                  </label>
                ))}
                <label>
                  <span>Specific objects, colours or lights to keep</span>
                  <input
                    maxLength={240}
                    value={direction.preserve.details}
                    onChange={(e) =>
                      setDirection((s) => ({
                        ...s,
                        preserve: { ...s.preserve, details: e.target.value },
                      }))}
                  />
                </label>
              </fieldset>
              <fieldset>
                <legend>Permitted changes</legend>
                {changes.map((k) => (
                  <label className="rs-check" key={k}>
                    <input
                      type="checkbox"
                      checked={direction.changes.includes(k)}
                      onChange={(e) =>
                        setDirection((s) => ({
                          ...s,
                          changes: e.target.checked
                            ? [...s.changes, k]
                            : s.changes.filter((x) => x !== k),
                        }))}
                    />
                    {changeLabels[k]}
                  </label>
                ))}
              </fieldset>
              {(["colour", "detail", "mood"] as const).map((k) => (
                <label key={k}>
                  <span>
                    {k === "colour"
                      ? "Colour direction"
                      : k === "detail"
                      ? "Detail handling"
                      : "Mood"}
                  </span>
                  <select
                    value={direction[k]}
                    onChange={(e) =>
                      setDirection((s) => ({ ...s, [k]: e.target.value }))}
                  >
                    {(k === "colour"
                      ? ["original", "warmer", "cooler", "restrained"]
                      : k === "detail"
                      ? ["original", "reduce-background", "large-shapes"]
                      : ["original", "quiet", "luminous", "dramatic"]).map(
                        (v) => (
                          <option key={v} value={v}>
                            {v.replaceAll("-", " ")}
                          </option>
                        ),
                      )}
                  </select>
                </label>
              ))}
            </details>
            <label>
              <span>Optional short instruction</span>
              <textarea
                maxLength={600}
                placeholder="Keep the old building; remove the parked car and simplify the background trees."
                value={direction.instruction}
                onChange={(e) =>
                  setDirection((s) => ({ ...s, instruction: e.target.value }))}
              />
            </label>
            <p className="rs-muted">
              Requests to remove, add or reposition minor objects are
              approximate. Precise masks and guaranteed identity/geometry
              preservation are not offered. Protected features take priority.
            </p>
          </fieldset>
          <h2>3. Generate one reference</h2>
          {!cap.enabled
            ? (
              <p className="rs-status">
                AI image transformation is not enabled for this account. Local
                preparation and PNG planning exports work without AI. The owner
                must configure the backend and a separate image-edit allowance.
              </p>
            )
            : (
              <p>
                Image-edit attempts available:{" "}
                {cap.remaining}. This allowance is separate from your artwork
                critique quota.
              </p>
            )}
          <label className="rs-check">
            <input
              type="checkbox"
              checked={consent}
              disabled={busy}
              onChange={(e) => setConsent(e.target.checked)}
            />I authorise one image-edit attempt, which may incur a provider
            charge and use one separate allowance even if completion is
            uncertain. My image and direction will be sent to OpenAI.
          </label>
          <button
            className="rs-primary"
            onClick={() => void generate()}
            disabled={!photo || !prepared || !consent || !cap.enabled ||
              cap.remaining < 1 || busy || !!receipt || !storageOK}
          >
            {busy ? "Generating one reference…" : "Generate improved reference"}
          </button>
          <p className="rs-muted">
            Output follows your prepared crop, rounded to the provider’s
            16-pixel grid. No automatic generations, retries or extra
            alternatives. Completed references save privately. Provider
            retention follows your organisation’s OpenAI settings; API images
            may be retained for abuse monitoring.
          </p>
          {!storageOK && (
            <p role="alert">
              Your browser cannot retain a request receipt. Enable session
              storage before a paid generation; local tools remain available.
            </p>
          )}
          {message && (
            <p
              ref={status}
              tabIndex={-1}
              role={busy ? "status" : "alert"}
              className="rs-alert"
            >
              {message}
            </p>
          )}
          {receipt && (
            <div className="rs-actions">
              <button onClick={() => openReceipt(receipt)}>
                Check saved request
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  setReceipt(undefined);
                  setConsent(false);
                  setMessage(
                    "A new edit uses a new allowance. Unresolved provider requests must be reconciled first.",
                  );
                }}
              >
                Prepare a separate attempt
              </button>
            </div>
          )}
        </section>
      </div>
      {prepared && <PlanningTools blob={prepared.blob} />}
    </StudioShell>
  );
}
