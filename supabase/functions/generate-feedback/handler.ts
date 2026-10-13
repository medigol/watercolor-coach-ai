import {
  validInput,
  validFeedback,
  uuid,
  readLimited,
  limitMessage,
  type Input,
  type Saved,
} from "../_shared/contract.ts";
import { improveResult, referenceResult } from "../_shared/mockResults.ts";
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
  mock(user: User, input: Input, result: unknown): Promise<Saved>;
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
function success(saved: Saved, warning?: string) {
  if (!uuid(saved.id) || !["mock", "openai"].includes(saved.provider))
    throw new Error("Invalid save");
  return reply({
    id: saved.id,
    provider: saved.provider,
    ...(warning && saved.provider === "mock" ? { warning } : {}),
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
      if (existing) return success(existing);
      const usage = await deps.usage(user);
      if (usage.used >= Math.min(usage.limit, 3))
        return reply({ code: "usage_limit", message: limitMessage }, 403);
      const sample =
        input.mode === "improve_painting" ? improveResult : referenceResult;
      if (!deps.hasOpenAI || !input.image_path)
        return success(
          await deps.mock(user, input, sample),
          "Automatic feedback is unavailable. We saved a sample guide instead.",
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
      if (claim.status === "existing") return success(claim);
      claimed = true;
      let data: Record<string, unknown> | null = null;
      try {
        const bytes = await deps.download(user, input.image_path);
        const generated = await deps.generate(input, bytes);
        if (validFeedback(generated, input.mode)) data = generated;
      } catch {
        /* Never expose upstream errors, keys, prompts, or image contents. */
      }
      if (data) return success(await deps.finish(user, input, data));
      return success(
        await deps.mock(user, input, sample),
        "Automatic feedback is unavailable. We saved a sample guide instead.",
      );
    } catch {
      // A database/network outcome may be uncertain; frontend fallback reuses the
      // same artwork ID so it cannot create a duplicate or overwrite a real result.
      return reply(
        {
          code: "unavailable",
          message: "Feedback is temporarily unavailable.",
        },
        503,
      );
    } finally {
      if (claimed) await deps.release(user, input).catch(() => {});
    }
  };
}
