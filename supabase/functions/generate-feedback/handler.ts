import {
  validInput,
  validFeedback,
  cleanFeedback,
  uuid,
  readLimited,
  limitMessage,
  type Input,
  type Saved,
} from "../_shared/contract.ts";
import {
  canonicalValidationIssue,
  hasPaintingAnalysis,
} from "../../../shared/paintingAnalysis.ts";
export interface User {
  id: string;
  token: string;
}
export type Claim =
  | { status: "claimed" | "busy" | "limit" }
  | ({ status: "existing" } & Saved);
export interface Dependencies {
  hasOpenAI: boolean;
  verify(token: string): Promise<User | null>;
  existing(user: User, input: Input): Promise<Saved | null>;
  usage(user: User): Promise<{ used: number; limit: number }>;
  claim(user: User, input: Input): Promise<Claim>;
  download(user: User, path: string): Promise<Uint8Array>;
  generate(input: Input, bytes: Uint8Array): Promise<unknown>;
  finish(
    user: User,
    input: Input,
    result: Record<string, unknown>,
  ): Promise<Saved>;
  release(user: User, input: Input): Promise<void>;
}
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const reply = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
function success(saved: Saved, expectedId: string) {
  if (
    saved.id !== expectedId ||
    !uuid(saved.id) ||
    !["mock", "openai"].includes(saved.provider)
  )
    throw new Error("Invalid save");
  return reply({
    id: saved.id,
    provider: saved.provider,
  });
}
export function createHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST")
      return reply(
        { code: "invalid_request", message: "Use a feedback request." },
        405,
      );
    const match = request.headers
      .get("Authorization")
      ?.match(/^Bearer ([^\s]+)$/i);
    if (!match)
      return reply({ code: "auth", message: "Please sign in again." }, 401);
    let user: User | null;
    try {
      user = await deps.verify(match[1]);
    } catch {
      return reply({ code: "auth", message: "Please sign in again." }, 401);
    }
    if (!user || !uuid(user.id))
      return reply({ code: "auth", message: "Please sign in again." }, 401);
    let input: Input;
    try {
      const raw: unknown = JSON.parse(await readLimited(request.body, 4096));
      if (!validInput(raw, user.id))
        return reply(
          {
            code: "invalid_request",
            message: "Your account or image changed. Please try again.",
          },
          400,
        );
      input = raw;
    } catch {
      return reply(
        { code: "invalid_request", message: "We could not read this request." },
        400,
      );
    }
    let claimed = false;
    try {
      const existing = await deps.existing(user, input);
      if (existing) return success(existing, input.request_id);
      const usage = await deps.usage(user);
      if (usage.used >= Math.min(usage.limit, 3))
        return reply({ code: "usage_limit", message: limitMessage }, 403);
      if (!deps.hasOpenAI)
        return reply(
          {
            code: "unavailable",
            message:
              "Live AI feedback could not be prepared. Please try again.",
          },
          503,
        );
      if (!input.image_path)
        return reply(
          {
            code: "invalid_request",
            message: "Select an image before requesting live feedback.",
          },
          400,
        );
      const claim = await deps.claim(user, input);
      if (claim.status === "limit")
        return reply({ code: "usage_limit", message: limitMessage }, 403);
      if (claim.status === "busy")
        return reply(
          {
            code: "busy",
            message:
              "Feedback is already being prepared. Check My Artworks in a moment.",
          },
          409,
        );
      if (claim.status === "existing") return success(claim, input.request_id);
      claimed = true;
      const bytes = await deps.download(user, input.image_path);
      const generated = await deps.generate(input, bytes);
      const data = cleanFeedback(generated, input.mode);
      if (
        !validFeedback(data, input.mode) ||
        (input.mode === "improve_painting" && !hasPaintingAnalysis(data))
      ) {
        if (input.mode === "improve_painting") {
          // Private, fixed reason codes only. Never log model prose, images,
          // identifiers, upstream errors or credentials; keep the reply generic.
          const reason =
            data === null
              ? (canonicalValidationIssue(generated) ?? "core_text_cleaning")
              : (canonicalValidationIssue(data) ?? "required_structure");
          console.warn(`canonical_invalid:${reason}`);
        }
        return reply(
          {
            code: "unavailable",
            message:
              "Live AI feedback could not be prepared. Please try again.",
          },
          422,
        );
      }
      const saved = await deps.finish(user, input, data);
      if (saved.provider !== "openai") throw new Error("Invalid live save");
      return success(saved, input.request_id);
    } catch {
      // Never expose upstream details or replace a live request with a sample.
      // A save may have committed before its response was lost. Reuse this ID on
      // manual retry so existing() can recover it without another model call.
      return reply(
        {
          code: "unavailable",
          message: "Live AI feedback could not be prepared. Please try again.",
        },
        503,
      );
    } finally {
      if (claimed) await deps.release(user, input).catch(() => {});
    }
  };
}
