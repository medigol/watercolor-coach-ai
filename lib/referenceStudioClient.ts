import { requireSupabase } from "./supabase";
import {
  type ReferenceRecord,
  type StudioRequest,
  validReferenceRecord,
  validStudioRequest,
} from "../shared/referenceStudio";
import { imageHash, imageHeader } from "../shared/referenceImage";
export const studioBucket = "reference-studio";
export const studioKey = (owner: string) =>
  `watercolor:reference-studio:v1:${owner}`;
async function account(owner: string) {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error || !data.user || data.user.id !== owner || data.user.is_anonymous) {
    throw Error("Please sign in again.");
  }
}
export async function studioCapabilities(
  owner: string,
): Promise<{ enabled: boolean; remaining: number }> {
  await account(owner);
  const { data, error } = await requireSupabase().functions.invoke(
    "transform-reference",
    { body: { action: "capabilities" }, timeout: 20000 },
  );
  await account(owner);
  return !error && data && typeof data.enabled === "boolean" &&
      Number.isInteger(data.remaining) && data.remaining >= 0
    ? { enabled: data.enabled, remaining: data.remaining }
    : { enabled: false, remaining: 0 };
}
export async function submitReference(
  owner: string,
  r: StudioRequest,
  source: Uint8Array,
  input: Uint8Array,
): Promise<ReferenceRecord | undefined> {
  if (!validStudioRequest(r, owner)) throw Error("Invalid reference choices.");
  await account(owner);
  // The caller writes an account-scoped receipt BEFORE this deliberate action.
  const client = requireSupabase();
  for (
    const [bytes, identity, mime] of [[
      source,
      r.source,
      imageHeader(source).mime,
    ], [input, r.input, "image/png"]] as const
  ) {
    if (
      bytes.length !== identity.bytes ||
      await imageHash(bytes) !== identity.sha256
    ) throw Error("Photo changed. Choose it again.");
    await account(owner);
    const { error } = await client.storage.from(studioBucket).upload(
      identity.path,
      bytes,
      { contentType: mime, upsert: false },
    );
    if (error) {
      throw Error(
        "Private upload was not confirmed. Check saved requests before starting again.",
      );
    }
  }
  await account(owner);
  const { data, error } = await client.functions.invoke("transform-reference", {
    body: r,
    timeout: 125000,
  });
  await account(owner);
  if (
    !error && validReferenceRecord(data?.record, owner) &&
    data.record.id === r.id
  ) return data.record;
  if (!error && data?.code === "completion_uncertain") return undefined;
  // Never resubmit on an HTTP error: provider dispatch may already have happened.
  throw Error(
    "Generation was not confirmed. Check this request; do not submit another paid edit.",
  );
}
export async function referenceRecord(
  owner: string,
  id: string,
): Promise<ReferenceRecord> {
  await account(owner);
  const { data, error } = await requireSupabase().from("reference_generations")
    .select("*").eq("user_id", owner).eq("id", id).single();
  await account(owner);
  if (error || !validReferenceRecord(data, owner)) {
    throw Error(
      "This reference request could not be opened. No new generation was started.",
    );
  }
  return data;
}
export async function referenceBytes(
  owner: string,
  r: ReferenceRecord,
  kind: "source" | "input" | "output",
): Promise<Blob> {
  if (!validReferenceRecord(r, owner)) throw Error("Reference unavailable.");
  await account(owner);
  const identity = kind === "output"
    ? r.output_metadata
    : kind === "source"
    ? r.request_json.source
    : r.request_json.input;
  const path = kind === "output"
    ? r.output_path
    : kind === "source"
    ? r.request_json.source.path
    : r.request_json.input.path;
  if (!identity || !path) throw Error("No completed image yet.");
  const { data, error } = await requireSupabase().storage.from(studioBucket)
    .download(path);
  await account(owner);
  if (error || !data) {
    throw Error(
      "Private image could not be opened. Check your connection and retry.",
    );
  }
  const bytes = new Uint8Array(await data.arrayBuffer());
  const h = imageHeader(bytes);
  if (
    bytes.length !== identity.bytes ||
    await imageHash(bytes) !== identity.sha256 || h.width !== identity.width ||
    h.height !== identity.height
  ) throw Error("Saved image failed its integrity check.");
  return data;
}
export async function listReferences(
  owner: string,
): Promise<ReferenceRecord[]> {
  await account(owner);
  const { data, error } = await requireSupabase().from("reference_generations")
    .select("*").eq("user_id", owner).order("created_at", { ascending: false })
    .limit(30);
  await account(owner);
  if (
    error || !Array.isArray(data) ||
    !data.every((v) => validReferenceRecord(v, owner))
  ) {
    throw Error(
      "Reference studio is not configured or saved references could not be loaded.",
    );
  }
  return data;
}
