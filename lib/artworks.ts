import { requireSupabase } from "./supabase";
import { improveResult, referenceResult } from "../data/mockResults";
export type ResultProvider = "mock" | "openai";
export const freeLimitMessage =
  "You have used your 3 free AI feedback results. More feedback will be available after subscriptions are added.";
export function createSaveAttempt(): SaveAttempt {
  return { id: requestId() };
}
export interface SaveAttempt {
  id: string;
  ownerId?: string;
  imagePath?: string | null;
  warning?: string | null;
  mayHaveSaved?: boolean;
}
function requestId() {
  // This is an idempotency identifier, never a credential or an access token.
  return (
    globalThis.crypto?.randomUUID?.() ??
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const n = Math.floor(Math.random() * 16);
      return (c === "x" ? n : (n & 3) | 8).toString(16);
    })
  );
}
function validSave(
  value: unknown,
  id: string,
): value is { id: string; provider: ResultProvider; warning?: string } {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.id === id && (v.provider === "mock" || v.provider === "openai");
}
export type SavedMode = "improve_painting" | "create_reference";
import type { CoachingOverlay } from "./overlays";
export type ImproveData = typeof improveResult & {
  overlays?: CoachingOverlay[] | null;
};
export type ReferenceData = typeof referenceResult & {
  overlays?: CoachingOverlay[] | null;
};
export interface ArtworkImage {
  uri: string;
  mimeType?: string | null;
  fileSize?: number;
}
export interface SavedArtwork {
  id: string;
  mode: SavedMode;
  title: string;
  image_url: string | null;
  focus_area: string | null;
  created_at: string;
}
const imageLimit = 10 * 1024 * 1024;
export function validArtworkId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
export function validArtwork(value: unknown): value is SavedArtwork {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    validArtworkId(row.id) &&
    (row.mode === "improve_painting" || row.mode === "create_reference") &&
    typeof row.title === "string" &&
    row.title.trim().length > 0 &&
    (row.image_url === null || typeof row.image_url === "string") &&
    (row.focus_area === null || typeof row.focus_area === "string") &&
    typeof row.created_at === "string" &&
    Number.isFinite(Date.parse(row.created_at))
  );
}
function imageType(bytes: ArrayBuffer) {
  const header = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 12));
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff)
    return { mime: "image/jpeg", extension: "jpg" };
  if (
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => header[index] === value,
    )
  )
    return { mime: "image/png", extension: "png" };
  if (
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  )
    return { mime: "image/webp", extension: "webp" };
  return undefined;
}
export async function saveArtwork(
  mode: SavedMode,
  focus: string | null,
  image?: ArtworkImage,
  attempt: SaveAttempt = createSaveAttempt(),
) {
  const client = requireSupabase();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user)
    throw new Error("Please sign in again before saving.");
  const ownerId = user.id;
  if (
    !validArtworkId(attempt.id) ||
    (attempt.ownerId && attempt.ownerId !== ownerId)
  )
    throw new Error("Your account changed. Please try again after signing in.");
  attempt.ownerId = ownerId;
  let path = attempt.imagePath ?? null;
  let warning = attempt.warning ?? null;
  async function checkAccount() {
    const { data, error } = await client.auth.getSession();
    if (error || data.session?.user.id !== ownerId)
      throw new Error(
        "Your account changed. Please try again after signing in.",
      );
  }
  if (image && attempt.imagePath === undefined) {
    try {
      if (image.fileSize !== undefined && image.fileSize > imageLimit)
        throw new Error("Image too large");
      const response = await fetch(image.uri);
      if (!response.ok) throw new Error("Image unavailable");
      const size = Number(response.headers.get("content-length"));
      if (Number.isFinite(size) && size > imageLimit)
        throw new Error("Image too large");
      const bytes = await response.arrayBuffer();
      // Use file signatures, rather than trusting a filename or supplied MIME.
      const format = imageType(bytes);
      if (!format || !bytes.byteLength || bytes.byteLength > imageLimit)
        throw new Error("Unsupported image");
      await checkAccount();
      const next = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${format.extension}`;
      const { error } = await client.storage
        .from("artworks")
        .upload(next, bytes, { contentType: format.mime, upsert: false });
      if (error) throw error;
      path = next;
    } catch {
      warning =
        "Your image could not be stored. We saved your sample feedback and will show the sample artwork instead.";
    }
  }
  const result = mode === "improve_painting" ? improveResult : referenceResult;
  const id = attempt.id;
  attempt.imagePath = path;
  attempt.warning = warning;
  let definitelyRejected = false;
  let rpcStarted = false;
  let edgeMayHaveSaved = attempt.mayHaveSaved ?? false;
  let specificError: string | null = null;
  try {
    await checkAccount();
    // One ID is shared by Edge and local fallback. If a response is lost after
    // commit, the fallback returns that saved result instead of saving twice.
    edgeMayHaveSaved = true;
    let edge: { data: unknown; error: unknown };
    try {
      edge = await client.functions.invoke("generate-feedback", {
        body: {
          request_id: id,
          mode,
          focus_area: focus,
          image_path: path,
          expected_user_id: ownerId,
        },
        timeout: 65000,
      });
    } catch {
      edge = { data: null, error: true };
    }
    if (!edge.error && validSave(edge.data, id)) {
      attempt.mayHaveSaved = true;
      await checkAccount();
      const edgeWarning =
        typeof edge.data.warning === "string" ? edge.data.warning : null;
      return {
        id,
        provider: edge.data.provider,
        warning: warning ?? edgeWarning,
      };
    }
    const context = (edge.error as { context?: Response } | null)?.context;
    if (context instanceof Response) {
      // Only definite rejections can safely discard an uploaded image.
      if ([400, 401, 403, 404, 405].includes(context.status))
        edgeMayHaveSaved = attempt.mayHaveSaved ?? false;
      const problem = await context
        .clone()
        .json()
        .catch(() => null);
      if (problem?.code === "usage_limit") specificError = freeLimitMessage;
      if (problem?.code === "auth")
        specificError = "Please sign in again before saving.";
      if (problem?.code === "invalid_request")
        specificError = "Your account or image changed. Please try again.";
      if (problem?.code === "busy")
        specificError =
          "Feedback is already being prepared. Check My Artworks in a moment.";
      if (specificError) throw new Error(specificError);
    }
    await checkAccount();
    rpcStarted = true;
    const { data, error, status } = await client.rpc("save_mock_feedback", {
      p_mode: mode,
      p_title: result.title,
      p_focus_area: focus,
      p_image_path: path,
      p_result: result,
      p_expected_user_id: ownerId,
      p_request_id: id,
    });
    definitelyRejected =
      !!error &&
      status >= 400 &&
      status < 500 &&
      status !== 408 &&
      status !== 429;
    if (error || !validSave(data, id)) throw new Error("Save failed");
    attempt.mayHaveSaved = true;
    await checkAccount();
    return {
      id,
      provider: data.provider,
      warning:
        warning ??
        (data.provider === "mock"
          ? "Automatic feedback is unavailable. We saved a sample guide instead."
          : null),
    };
  } catch {
    attempt.mayHaveSaved ||=
      edgeMayHaveSaved || (rpcStarted && !definitelyRejected);
    if (path && !attempt.mayHaveSaved && (!rpcStarted || definitelyRejected)) {
      // A definite rejection may remove the image. A retry must upload again;
      // uncertain outcomes retain both the path and ID for safe recovery.
      attempt.imagePath = undefined;
      attempt.warning = undefined;
      await client.storage
        .from("artworks")
        .remove([path])
        .catch(() => {});
    }
    throw new Error(
      specificError ??
        ((rpcStarted && !definitelyRejected) || edgeMayHaveSaved
          ? "We could not confirm your save. Check My Artworks before trying again."
          : "We could not save your feedback. Check your connection and account setup, then try again."),
    );
  }
}

export async function imageUrl(path: string | null) {
  if (
    typeof path !== "string" ||
    !path ||
    path.startsWith("/") ||
    path.includes(":") ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  )
    return undefined;
  try {
    const { data, error } = await requireSupabase()
      .storage.from("artworks")
      .createSignedUrl(path, 3600);
    return error ? undefined : data?.signedUrl;
  } catch {
    return undefined;
  }
}
export function validResult(
  value: unknown,
  mode: SavedMode,
): value is ImproveData | ReferenceData {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (mode !== "improve_painting" && mode !== "create_reference")
  )
    return false;
  const v = value as Record<string, unknown>;
  const strings =
    mode === "improve_painting"
      ? [
          "title",
          "mainAdvice",
          "composition",
          "sketch",
          "values",
          "practice",
          "prompt",
        ]
      : ["title", "composition", "sketch", "values"];
  if (!strings.every((key) => typeof v[key] === "string" && v[key].trim()))
    return false;
  const arrays =
    mode === "improve_painting" ? ["whatWorks", "whatToFix"] : ["steps"];
  if (
    !arrays.every(
      (key) =>
        Array.isArray(v[key]) &&
        v[key].length > 0 &&
        (v[key] as unknown[]).every(
          (item) => typeof item === "string" && item.trim(),
        ),
    )
  )
    return false;
  return (
    mode === "improve_painting" ||
    (Array.isArray(v.palette) &&
      v.palette.length > 0 &&
      v.palette.every(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.name === "string" &&
          item.name.trim() &&
          typeof item.hex === "string" &&
          /^#[0-9a-f]{6}$/i.test(item.hex),
      ))
  );
}
