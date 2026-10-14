import { requireSupabase } from "./supabase";
import { improveResult, referenceResult } from "../data/mockResults";
import type {
  BrushWashStep,
  CoachingMode,
  CompositionDecision,
  PaletteColour,
} from "../types";
export type ResultProvider = "mock" | "openai";
export const freeLimitMessage =
  "You have used your 3 free AI feedback results. More feedback will be available after subscriptions are added.";
export const liveFeedbackErrorMessage =
  "Live AI feedback could not be prepared. Please try again.";
const signInMessage = "Please sign in again before requesting feedback.";
const busyMessage =
  "Feedback is already being prepared. Check My Artworks in a moment.";
export function createSaveAttempt(): SaveAttempt {
  return { id: requestId() };
}
export interface SaveAttempt {
  id: string;
  ownerId?: string;
  imagePath?: string | null;
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
): value is { id: string; provider: "openai" } {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.id === id && v.provider === "openai";
}
export type SavedMode = "improve_painting" | "create_reference";
import type { CoachingOverlay } from "./overlays";
export type ImproveData = typeof improveResult & {
  coachingMode?: CoachingMode | null;
  overlays?: CoachingOverlay[] | null;
  palette?: PaletteColour[] | null;
  paletteStrategy?: string | null;
  compositionDecision?: CompositionDecision | null;
  promising?: string | null;
  brushPlan?: BrushWashStep[] | null;
};
export type ReferenceData = Omit<typeof referenceResult, "palette"> & {
  palette: PaletteColour[];
  coachingMode?: CoachingMode | null;
  overlays?: CoachingOverlay[] | null;
  paletteStrategy?: string | null;
  compositionDecision?: CompositionDecision | null;
  promising?: string | null;
  brushPlan?: BrushWashStep[] | null;
  whatWorks?: string[] | null;
  whatToFix?: string[] | null;
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
  let identity: Awaited<ReturnType<typeof client.auth.getUser>>;
  try {
    identity = await client.auth.getUser();
  } catch {
    throw new Error(liveFeedbackErrorMessage);
  }
  const { data: { user }, error: authError } = identity;
  if (
    authError &&
    (authError.name === "AuthRetryableFetchError" ||
      authError.status === 0 || (authError.status ?? 0) >= 500)
  )
    throw new Error(liveFeedbackErrorMessage);
  if (authError || !user)
    throw new Error(signInMessage);
  const ownerId = user.id;
  if (
    !validArtworkId(attempt.id) ||
    (attempt.ownerId && attempt.ownerId !== ownerId)
  )
    throw new Error(signInMessage);
  attempt.ownerId = ownerId;
  let path = attempt.imagePath ?? null;
  async function checkAccount() {
    const { data, error } = await client.auth.getSession();
    if (error || data.session?.user.id !== ownerId)
      throw new Error(signInMessage);
  }
  if (!path) {
    if (!image)
      throw new Error("Choose a painting or photo before requesting feedback.");
    let uploadMessage =
      "Your image could not be uploaded. Choose it again and try again.";
    try {
      if (image.fileSize !== undefined && image.fileSize > imageLimit) {
        uploadMessage = "Choose an image smaller than 10 MB, then try again.";
        throw new Error("Image too large");
      }
      const response = await fetch(image.uri);
      if (!response.ok) throw new Error("Image unavailable");
      const size = Number(response.headers.get("content-length"));
      if (Number.isFinite(size) && size > imageLimit) {
        uploadMessage = "Choose an image smaller than 10 MB, then try again.";
        throw new Error("Image too large");
      }
      const bytes = await response.arrayBuffer();
      // Use file signatures, rather than trusting a filename or supplied MIME.
      const format = imageType(bytes);
      if (bytes.byteLength > imageLimit) {
        uploadMessage = "Choose an image smaller than 10 MB, then try again.";
        throw new Error("Image too large");
      }
      if (!format || !bytes.byteLength) {
        uploadMessage = "Choose a JPEG, PNG, or WebP image, then try again.";
        throw new Error("Unsupported image");
      }
      await checkAccount();
      const next = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${format.extension}`;
      const { error } = await client.storage
        .from("artworks")
        .upload(next, bytes, { contentType: format.mime, upsert: false });
      if (error) throw error;
      path = next;
    } catch (error) {
      // A failed upload remains retryable. It must never submit a null image or
      // turn the user's live request into a sample result.
      attempt.imagePath = undefined;
      throw new Error(
        error instanceof Error && error.message === signInMessage
          ? signInMessage : uploadMessage,
      );
    }
  }
  const id = attempt.id;
  attempt.imagePath = path;
  let definitelyRejected = false;
  let edgeStarted = false;
  let edgeMayHaveSaved = attempt.mayHaveSaved ?? false;
  let message = liveFeedbackErrorMessage;
  try {
    await checkAccount();
    // Retries reuse this ID and upload so Edge can return an already-saved
    // OpenAI result after a lost response, without another model call or charge.
    edgeStarted = true;
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
      return {
        id,
        provider: edge.data.provider,
        warning: null,
      };
    }
    if (
      !edge.error &&
      edge.data &&
      typeof edge.data === "object" &&
      (edge.data as Record<string, unknown>).id === id &&
      (edge.data as Record<string, unknown>).provider === "mock"
    ) {
      // A stale Edge deployment may have saved a sample under this ID. Keep
      // its referenced image, but let the next manual retry request live feedback
      // under a fresh ID after the deployment is fixed. Never retry automatically.
      attempt.id = requestId();
      attempt.mayHaveSaved = true;
    }
    const context = (edge.error as { context?: Response } | null)?.context;
    if (context instanceof Response) {
      // Only definite rejections can safely discard an uploaded image.
      definitelyRejected =
        context.status >= 400 && context.status < 500 &&
        ![408, 409, 429].includes(context.status);
      if (definitelyRejected)
        edgeMayHaveSaved = attempt.mayHaveSaved ?? false;
      const problem = await context
        .clone()
        .json()
        .catch(() => null);
      if (problem?.code === "usage_limit") message = freeLimitMessage;
      else if (problem?.code === "auth" || context.status === 401)
        message = signInMessage;
      else if (problem?.code === "busy") message = busyMessage;
    }
    // HTTP 200 with a sample/invalid provider can come from a stale deployment.
    // Reject it instead of navigating to a critique that never analysed the image.
    throw new Error(message);
  } catch (error) {
    if (error instanceof Error && error.message === signInMessage)
      message = signInMessage;
    attempt.mayHaveSaved ||= edgeMayHaveSaved;
    if (path && !attempt.mayHaveSaved && (!edgeStarted || definitelyRejected)) {
      // A definite rejection may remove the image. A retry must upload again;
      // uncertain outcomes retain both the path and ID for safe recovery.
      attempt.imagePath = undefined;
      await client.storage
        .from("artworks")
        .remove([path])
        .catch(() => {});
    }
    throw new Error(
      message === liveFeedbackErrorMessage && attempt.mayHaveSaved
        ? `${message} Check My Artworks before requesting it again; your result may already be saved.`
        : message,
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
        (key === "whatToFix" || v[key].length > 0) &&
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
