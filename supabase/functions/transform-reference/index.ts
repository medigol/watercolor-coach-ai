import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { type Claim, studioHandler, type StudioUser } from "./handler.ts";
import { editReference } from "./provider.ts";
import { decodeReference } from "./image.ts";
import {
  referenceModel,
  type ReferenceRecord,
  type StudioRequest,
  validReferenceRecord,
} from "../../../shared/referenceStudio.ts";
import {
  imageHash,
  referenceByteLimit,
} from "../../../shared/referenceImage.ts";
const url = Deno.env.get("SUPABASE_URL"),
  anon = Deno.env.get("SUPABASE_ANON_KEY"),
  service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  key = Deno.env.get("REFERENCE_STUDIO_OPENAI_API_KEY"),
  configurationPin = Deno.env.get("REFERENCE_STUDIO_APPROVED_CONFIG_SHA256"),
  approvedConfigurationSha256 = /^[a-f0-9]{64}$/.test(configurationPin ?? "")
    ? configurationPin
    : null,
  releaseValue = Deno.env.get("REFERENCE_STUDIO_RELEASE_SHA"),
  release = /^[a-f0-9]{40}$/.test(releaseValue ?? "") ? releaseValue : null;
const enabled = !!(url && anon && service && key &&
  release &&
  /^[a-f0-9]{64}$/.test(approvedConfigurationSha256 ?? "") &&
  Deno.env.get("REFERENCE_STUDIO_ENABLED") === "true" &&
  Deno.env.get("REFERENCE_STUDIO_BUDGET_ACK") === "image-edits-v1");
const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: ((input, init) =>
      fetch(input, {
        ...init,
        signal: init?.signal ?? AbortSignal.timeout(15000),
      })) as typeof fetch,
  },
};
const userClient = (u: StudioUser) =>
  createClient(url!, anon!, {
    ...options,
    global: {
      ...options.global,
      headers: { Authorization: `Bearer ${u.token}` },
    },
  });
const admin = () => {
  if (!url || !service) throw Error("Setup required");
  return createClient(url, service, options);
};
function checked(value: unknown, owner: string): ReferenceRecord {
  if (!validReferenceRecord(value, owner)) {
    throw Error("Invalid reference record");
  }
  return value;
}
async function rpc(
  name: string,
  u: StudioUser,
  r: StudioRequest,
  extra: Record<string, unknown> = {},
) {
  const { data, error } = await admin().rpc(name, {
    p_owner: u.id,
    p_id: r.id,
    ...extra,
  });
  if (error) throw Error("Reference request unavailable");
  return data;
}
Deno.serve(studioHandler({
  enabled,
  environmentPresence: Object.fromEntries([
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "REFERENCE_STUDIO_OPENAI_API_KEY",
    "REFERENCE_STUDIO_ENABLED",
    "REFERENCE_STUDIO_BUDGET_ACK",
    "REFERENCE_STUDIO_APPROVED_CONFIG_SHA256",
    "REFERENCE_STUDIO_RELEASE_SHA",
  ].map((name) => [name, !!Deno.env.get(name)])),
  approvedConfigurationSha256,
  featureFlagEnabled: Deno.env.get("REFERENCE_STUDIO_ENABLED") === "true",
  budgetAcknowledged:
    Deno.env.get("REFERENCE_STUDIO_BUDGET_ACK") === "image-edits-v1",
  // Public deployment identity, not a credential or model-access claim.
  release,
  async verify(token) {
    if (!url || !anon) return null;
    const { data, error } = await createClient(url, anon, options).auth.getUser(
      token,
    );
    return error || !data.user || data.user.is_anonymous
      ? null
      : { id: data.user.id, token };
  },
  async access(u) {
    const { data, error } = await userClient(u).from(
      "reference_generation_accounts",
    ).select("enabled,attempt_limit,attempts_reserved").eq("user_id", u.id)
      .maybeSingle();
    if (error) throw Error("Setup required");
    if (data?.enabled) {
      const ready = await admin().rpc("reference_operations_version");
      if (ready.error || ready.data !== "reference-operations/v1") {
        throw Error("Operations migration required");
      }
    }
    return {
      enabled: !!data?.enabled,
      remaining: Math.max(
        0,
        (data?.attempt_limit ?? 0) - (data?.attempts_reserved ?? 0),
      ),
    };
  },
  async existing(u, id) {
    const { data, error } = await userClient(u).from("reference_generations")
      .select("*").eq("id", id).eq("user_id", u.id).maybeSingle();
    if (error) throw Error("Reference unavailable");
    return data ? checked(data, u.id) : null;
  },
  async download(u, path) {
    const { data, error } = await userClient(u).storage.from("reference-studio")
      .download(path);
    if (error || !data || data.size > referenceByteLimit) {
      throw Error("Source unavailable");
    }
    return new Uint8Array(await data.arrayBuffer());
  },
  decode: decodeReference,
  async claim(u, r) {
    const result = await rpc("claim_reference_generation", u, r, {
      p_request: r,
    });
    if (
      !result ||
      !["claimed", "existing", "busy", "limit", "disabled", "conflict"]
        .includes(result.status)
    ) throw Error("Reservation unavailable");
    if (result.status === "existing") {
      result.record = checked(result.record, u.id);
    }
    return result as Claim;
  },
  async beginDispatch(u, r) {
    return await rpc("begin_reference_dispatch", u, r, { p_request: r }) ===
      true;
  },
  generate(r, b, u) {
    return editReference(r, b, key!, fetch, async (receipt) => {
      await rpc("note_reference_provider_receipt", u, r, {
        p_request_id: receipt.requestId,
        p_http_status: receipt.httpStatus,
        p_usage: receipt.usage,
      });
    });
  },
  async save(u, r, bytes, size) {
    const path = `${u.id}/${r.id}/generated.png`;
    const { error } = await admin().storage.from("reference-studio").upload(
      path,
      bytes,
      { contentType: "image/png", upsert: false },
    );
    if (error) throw Error("Image save uncertain");
    return checked(
      await rpc("complete_reference_generation", u, r, {
        p_metadata: {
          ...size,
          bytes: bytes.length,
          sha256: await imageHash(bytes),
          model: referenceModel,
        },
      }),
      u.id,
    );
  },
  async uncertain(u, r) {
    await rpc("mark_reference_uncertain", u, r);
  },
}));
