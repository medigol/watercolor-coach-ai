import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { requireSupabase } from "../lib/supabase";
import {
  imageUrl,
  validResult,
  type SavedMode,
  type ImproveData,
  type ReferenceData,
} from "../lib/artworks";
export function useSavedResult<T extends ImproveData | ReferenceData>(
  sample: T,
  mode: SavedMode,
) {
  const params = useLocalSearchParams<{
    id?: string | string[];
    warning?: string;
    focus?: string;
  }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [result, setResult] = useState<T>(sample);
  const [image, setImage] = useState<string>();
  const [focus, setFocus] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(!!id);
    setError("");
    setImage(undefined);
    setResult(sample);
    if (!id) return;
    (async () => {
      try {
        const client = requireSupabase();
        const { data: row, error: problem } = await client
          .from("ai_results")
          .select(
            "result_json, artworks!ai_results_artwork_id_fkey!inner(image_url,focus_area)",
          )
          .eq("artwork_id", id)
          .eq("mode", mode)
          .single();
        if (problem || !row || !validResult(row.result_json, mode))
          throw new Error("Result unavailable");
        const artwork = Array.isArray(row.artworks)
          ? row.artworks[0]
          : row.artworks;
        const url = await imageUrl(artwork?.image_url ?? null);
        if (alive) {
          setResult(row.result_json as T);
          setFocus(artwork?.focus_area ?? null);
          setImage(url);
        }
      } catch {
        if (alive)
          setError(
            "We could not open this saved result. Please try again from My Artworks.",
          );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, mode, sample, attempt]);
  return {
    result,
    image,
    focus: id ? focus : params.focus,
    loading,
    error,
    warning: params.warning,
    retry: () => setAttempt((v) => v + 1),
  };
}
