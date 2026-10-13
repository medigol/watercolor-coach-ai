import { requireSupabase } from "./supabase";
import { improveResult, referenceResult } from "../data/mockResults";
export type SavedMode = "improve_painting" | "create_reference";
export type ImproveData = typeof improveResult;
export type ReferenceData = typeof referenceResult;
export interface SavedArtwork {
  id: string;
  mode: SavedMode;
  title: string;
  image_url: string | null;
  focus_area: string | null;
  created_at: string;
}
export async function saveArtwork(
  mode: SavedMode,
  focus: string | null,
  image?: { uri: string; mimeType?: string | null },
) {
  const client = requireSupabase();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user)
    throw new Error("Please sign in again before saving.");
  let path: string | null = null;
  let warning: string | null = null;
  if (image) {
    try {
      const response = await fetch(image.uri);
      if (!response.ok) throw new Error("Image unavailable");
      const bytes = await response.arrayBuffer();
      const mime =
        image.mimeType ||
        response.headers.get("content-type")?.split(";")[0] ||
        "image/jpeg";
      const extension = (
        {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        } as Record<string, string>
      )[mime];
      if (
        !extension ||
        !bytes.byteLength ||
        bytes.byteLength > 10 * 1024 * 1024
      )
        throw new Error("Unsupported image");
      const next = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const { error } = await client.storage
        .from("artworks")
        .upload(next, bytes, { contentType: mime, upsert: false });
      if (error) throw error;
      path = next;
    } catch {
      warning =
        "Your image could not be stored. We saved your sample feedback and will show the sample artwork instead.";
    }
  }
  const result = mode === "improve_painting" ? improveResult : referenceResult;
  try {
    const { data: id, error } = await client.rpc("save_mock_artwork", {
      p_mode: mode,
      p_title: result.title,
      p_focus_area: focus,
      p_image_path: path,
      p_result: result,
    });
    if (error || typeof id !== "string") throw new Error("Save failed");
    return { id, warning };
  } catch {
    if (path)
      await client.storage
        .from("artworks")
        .remove([path])
        .catch(() => {});
    throw new Error(
      "We could not save your feedback. Check your connection and account setup, then try again.",
    );
  }
}
export async function imageUrl(path: string | null) {
  if (!path) return undefined;
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
  if (!value || typeof value !== "object") return false;
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
  if (!strings.every((key) => typeof v[key] === "string")) return false;
  const arrays =
    mode === "improve_painting" ? ["whatWorks", "whatToFix"] : ["steps"];
  if (
    !arrays.every(
      (key) =>
        Array.isArray(v[key]) &&
        (v[key] as unknown[]).every((item) => typeof item === "string"),
    )
  )
    return false;
  return (
    mode === "improve_painting" ||
    (Array.isArray(v.palette) &&
      v.palette.every(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.name === "string" &&
          typeof item.hex === "string",
      ))
  );
}
