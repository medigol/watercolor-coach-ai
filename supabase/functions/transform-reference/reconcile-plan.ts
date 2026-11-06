/** OFFLINE ONLY. Builds an audited RPC payload; never connects or generates. */
import {
  isId,
  outputSize,
  referenceModel,
  validReferenceRecord,
} from "../../../shared/referenceStudio.ts";
import { imageHash } from "../../../shared/referenceImage.ts";
import { decodeReference } from "./image.ts";
const options = new Map<string, string>();
for (let i = 0; i < Deno.args.length; i += 2) {
  const k = Deno.args[i], v = Deno.args[i + 1];
  if (!k?.startsWith("--") || !v || options.has(k)) {
    throw Error("Use named option/value pairs");
  }
  options.set(k, v);
}
const allowed = [
  "--record",
  "--owner",
  "--operation",
  "--resolution",
  "--operator",
  "--evidence",
  "--workers-drained",
  "--provider-terminal",
  "--output",
];
if ([...options.keys()].some((k) => !allowed.includes(k))) {
  throw Error("Unknown option");
}
const required = (k: string) => {
  const v = options.get(k);
  if (!v) throw Error("Missing " + k);
  return v;
};
const owner = required("--owner"),
  operation = required("--operation"),
  resolution = required("--resolution");
if (
  !isId(owner) || !isId(operation) ||
  !["completed", "failed", "uncertain"].includes(resolution)
) throw Error("Invalid identity or resolution");
const raw: unknown = JSON.parse(await Deno.readTextFile(required("--record")));
if (!validReferenceRecord(raw, owner)) {
  throw Error("Invalid owned record snapshot");
}
const r = raw as typeof raw & {
  dispatch_phase?: unknown;
  updated_at?: unknown;
};
if (
  !["pending", "uncertain"].includes(r.status) ||
  !["reserved", "dispatched"].includes(String(r.dispatch_phase)) ||
  typeof r.updated_at !== "string" || !Number.isFinite(Date.parse(r.updated_at))
) throw Error("Fresh pending/uncertain operations snapshot required");
const bool = (key: string) => {
  const value = required(key);
  if (!["true", "false"].includes(value)) {
    throw Error("Boolean option required");
  }
  return value === "true";
};
const drained = bool("--workers-drained"),
  terminal = bool("--provider-terminal"),
  operator = required("--operator"),
  evidence = required("--evidence");
if (
  operator.trim().length < 1 || operator.length > 120 ||
  evidence.trim().length < 12 || evidence.length > 500 ||
  /(https?:\/\/|Bearer |sk-|sb_secret_)/i.test(evidence)
) {
  throw Error(
    "Use a short private ticket/evidence reference, without secrets or URLs",
  );
}
if (
  resolution !== "uncertain" &&
  (!drained || (r.dispatch_phase === "dispatched" && !terminal))
) {
  throw Error(
    "Do not release a hold without worker/provider terminal evidence",
  );
}
let metadata: null | {
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  model: typeof referenceModel;
} = null;
if (resolution === "completed") {
  if (r.dispatch_phase !== "dispatched") {
    throw Error("Never label an undispatched request completed");
  }
  const file = required("--output"), info = await Deno.stat(file);
  if (info.size > 10 * 1024 * 1024) throw Error("Output exceeds image limit");
  const bytes = await Deno.readFile(file),
    size = decodeReference(bytes),
    expected = outputSize(r.request_json).split("x").map(Number);
  if (
    size.width !== expected[0] || size.height !== expected[1] ||
    bytes[0] !== 137
  ) throw Error("Recovered file must be a fully decoded PNG at expected size");
  metadata = {
    ...size,
    bytes: bytes.length,
    sha256: await imageHash(bytes),
    model: referenceModel,
  };
} else if (options.has("--output")) {
  throw Error("No output file for a non-completed resolution");
}
// No task text, raw provider payload, source bytes, token or signed URL emitted.
console.log(JSON.stringify(
  {
    p_owner: owner,
    p_id: r.id,
    p_operation_id: operation,
    p_expected_status: r.status,
    p_expected_phase: r.dispatch_phase,
    p_expected_updated_at: r.updated_at,
    p_resolution: resolution,
    p_operator: operator.trim(),
    p_evidence: evidence.trim(),
    p_workers_drained: drained,
    p_provider_terminal: terminal,
    p_metadata: metadata,
  },
  null,
  2,
));
