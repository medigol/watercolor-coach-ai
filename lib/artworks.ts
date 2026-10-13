import { requireSupabase } from "./supabase";
import { improveResult, referenceResult } from "../data/mockResults";
export type SavedMode = "improve_painting" | "create_reference";
export type ImproveData = typeof improveResult;
export type ReferenceData = typeof referenceResult;
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
) {
  const client = requireSupabase();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user)
    throw new Error("Please sign in again before saving.");
  const ownerId = user.id;
  let path: string | null = null;
  let warning: string | null = null;
  async function checkAccount() {
    const { data, error } = await client.auth.getSession();
    if (error || data.session?.user.id !== ownerId)
      throw new Error(
        "Your account changed. Please try again after signing in.",
      );
  }
  if (image) {
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
  let definitelyRejected = false;
  let rpcStarted = false;
  try {
    await checkAccount();
    rpcStarted = true;
    const {
      data: id,
      error,
      status,
    } = await client.rpc("save_mock_artwork", {
      p_mode: mode,
      p_title: result.title,
      p_focus_area: focus,
      p_image_path: path,
      p_result: result,
      p_expected_user_id: ownerId,
    });
    // A lost response can follow a committed transaction. In that case the
    // image must remain; deleting it would damage the saved artwork.
    definitelyRejected =
      !!error &&
      status >= 400 &&
      status < 500 &&
      status !== 408 &&
      status !== 429;
    if (error || !validArtworkId(id)) throw new Error("Save failed");
    return { id, warning };
  } catch {
    if (path && (!rpcStarted || definitelyRejected))
      await client.storage
        .from("artworks")
        .remove([path])
        .catch(() => {});
    throw new Error(
      rpcStarted && !definitelyRejected
        ? "We could not confirm your save. Check My Artworks before trying again."
        : "We could not save your feedback. Check your connection and account setup, then try again.",
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
