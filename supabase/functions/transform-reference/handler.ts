import {
  canonicalReferenceJson,
  isId,
  outputSize,
  referenceModel,
  type ReferenceRecord,
  referenceTestPlan,
  sameReferenceRequest,
  type StudioRequest,
  validStudioRequest,
} from "../../../shared/referenceStudio.ts";
import { imageHash, imageHeader } from "../../../shared/referenceImage.ts";
export type StudioUser = { id: string; token: string };
export type Claim = {
  status: "claimed" | "existing" | "busy" | "limit" | "disabled" | "conflict";
  record?: ReferenceRecord;
};
export interface StudioDependencies {
  enabled: boolean;
  release?: string | null;
  approvedConfigurationSha256?: string | null;
  featureFlagEnabled?: boolean;
  budgetAcknowledged?: boolean;
  environmentPresence?: Record<string, boolean>;
  verify(token: string): Promise<StudioUser | null>;
  access(u: StudioUser): Promise<{ enabled: boolean; remaining: number }>;
  existing(u: StudioUser, id: string): Promise<ReferenceRecord | null>;
  download(u: StudioUser, path: string): Promise<Uint8Array>;
  decode(bytes: Uint8Array): { width: number; height: number };
  claim(u: StudioUser, r: StudioRequest): Promise<Claim>;
  beginDispatch(u: StudioUser, r: StudioRequest): Promise<boolean>;
  generate(
    r: StudioRequest,
    bytes: Uint8Array,
    user: StudioUser,
  ): Promise<Uint8Array>;
  save(
    u: StudioUser,
    r: StudioRequest,
    output: Uint8Array,
    size: { width: number; height: number },
  ): Promise<ReferenceRecord>;
  uncertain(u: StudioUser, r: StudioRequest): Promise<void>;
}
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
export function studioHandler(d: StudioDependencies) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (req.method !== "POST") return reply({ code: "method" }, 405);
    const token = req.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)
      ?.[1];
    if (!token) return reply({ code: "auth" }, 401);
    let u: StudioUser | null;
    try {
      u = await d.verify(token);
    } catch {
      return reply({ code: "auth" }, 401);
    }
    if (!u || !isId(u.id)) return reply({ code: "auth" }, 401);
    let body: unknown;
    try {
      if (!req.body) throw Error();
      const reader = req.body.getReader();
      let size = 0;
      const decoder = new TextDecoder();
      let text = "";
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 12000) throw Error();
          text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
      } finally {
        await reader.cancel().catch(() => {});
      }
      body = JSON.parse(text);
    } catch {
      return reply({ code: "invalid_request" }, 400);
    }
    if (
      body && typeof body === "object" && Object.keys(body).length === 1 &&
      "action" in body && body.action === "capabilities"
    ) {
      try {
        const a = await d.access(u);
        return reply({
          enabled: d.enabled && a.enabled,
          remaining: a.remaining,
          ownerId: u.id,
          runtime: {
            contract: "reference-studio/staging-v1",
            release: d.release ?? null,
            model: referenceModel,
            images: 1,
            quality: "medium",
            format: "png",
            configured: d.enabled,
            featureFlagEnabled: d.featureFlagEnabled ?? false,
            budgetAcknowledged: d.budgetAcknowledged ?? false,
            environmentPresence: d.environmentPresence ?? {},
            automaticRetries: false,
            approvedConfigurationSha256: d.approvedConfigurationSha256 ?? null,
          },
          policy:
            "One explicitly requested image; separate attempt allowance. Uncertain attempts remain reserved. No automatic retries.",
        });
      } catch {
        return reply({ enabled: false, remaining: 0, code: "setup_required" });
      }
    }
    if (
      body && typeof body === "object" && Object.keys(body).length === 2 &&
      "action" in body && body.action === "status" && "id" in body &&
      isId(body.id)
    ) {
      try {
        return reply({ record: await d.existing(u, body.id) });
      } catch {
        return reply({ code: "status_unavailable" }, 503);
      }
    }
    if (!validStudioRequest(body, u.id)) {
      return reply({ code: "invalid_request" }, 400);
    }
    const r = body;
    // No generation merely from reload/status/capability. Configuration and
    // account entitlement are checked before storage access or a paid reservation.
    if (!d.enabled) return reply({ code: "generation_disabled" }, 503);
    try {
      const existing = await d.existing(u, r.id);
      if (existing) {
        if (!sameReferenceRequest(existing.request_json, r)) {
          return reply({ code: "request_conflict" }, 409);
        }
        return reply({ record: existing });
      }
      if (
        d.approvedConfigurationSha256 &&
        await imageHash(
            new TextEncoder().encode(
              canonicalReferenceJson(referenceTestPlan(r).configuration),
            ),
          ) !== d.approvedConfigurationSha256
      ) {
        return reply({ code: "configuration_not_approved" }, 403);
      }
      const access = await d.access(u);
      if (!access.enabled || access.remaining < 1) {
        return reply({ code: "allowance_unavailable" }, 403);
      }
      if (r.parentId) {
        const parent = await d.existing(u, r.parentId);
        if (
          !parent || parent.status !== "completed" ||
          parent.output_metadata?.sha256 !== r.source.sha256
        ) return reply({ code: "invalid_parent" }, 400);
      }
      const source = await d.download(u, r.source.path),
        input = await d.download(u, r.input.path);
      const sourceMime = imageHeader(source).mime;
      if (
        (r.source.path.endsWith(".jpg") && sourceMime !== "image/jpeg") ||
        (r.source.path.endsWith(".png") && sourceMime !== "image/png")
      ) throw Error("Source format mismatch");
      for (
        const [bytes, identity] of [[source, r.source], [
          input,
          r.input,
        ]] as const
      ) {
        const header = imageHeader(bytes), decoded = d.decode(bytes);
        if (
          bytes.length !== identity.bytes ||
          await imageHash(bytes) !== identity.sha256 ||
          header.width !== identity.width ||
          header.height !== identity.height ||
          decoded.width !== identity.width || decoded.height !== identity.height
        ) throw Error("Invalid image identity");
      }
      if (imageHeader(input).mime !== "image/png") {
        throw Error("Input must be prepared PNG");
      }
      const c = await d.claim(u, r);
      if (c.status === "existing") return reply({ record: c.record });
      if (c.status !== "claimed") return reply({ code: c.status }, 409);
      try {
        // Authorise dispatch exactly once, atomically with operator cancellation.
        // An ambiguous RPC response never justifies calling the paid provider.
        if (!await d.beginDispatch(u, r)) {
          return reply({ record: await d.existing(u, r.id) });
        }
        const output = await d.generate(r, input, u),
          h = imageHeader(output),
          size = d.decode(output);
        const [w, hgt] = outputSize(r).split("x").map(Number);
        if (h.mime !== "image/png" || size.width !== w || size.height !== hgt) {
          throw Error("Invalid output");
        }
        const result = await d.save(u, r, output, size);
        return reply({ record: result });
      } catch {
        await d.uncertain(u, r).catch(() => {});
        return reply({ code: "completion_uncertain", id: r.id }, 202);
      }
    } catch {
      return reply({ code: "preparation_unavailable" }, 422);
    }
  };
}
