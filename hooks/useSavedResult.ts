import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { requireSupabase } from "../lib/supabase";
import {
  imageUrl,
  validArtworkId,
  validResult,
  type SavedMode,
  type ResultProvider,
  type ImproveData,
  type ReferenceData,
} from "../lib/artworks";
import { useAuth } from "../providers/AuthProvider";
export function useSavedResult<T extends ImproveData | ReferenceData>(
  sample: T,
  mode: SavedMode,
) {
  const params = useLocalSearchParams<{
    id?: string | string[];
    warning?: string | string[];
    focus?: string | string[];
  }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { session } = useAuth();
  const userId = session?.user.id;
  const [result, setResult] = useState<T>(sample);
  const [provider, setProvider] = useState<ResultProvider>("mock");
  const [image, setImage] = useState<string>();
  const [focus, setFocus] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${userId ?? ""}/${mode}/${id ?? ""}/${attempt}`;
  const [completedRequest, setCompletedRequest] = useState("");
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setLoading(!!id);
    setError("");
    setImage(undefined);
    setFocus(null);
    setProvider("mock");
    setResult(sample);
    if (!id) return;
    (async () => {
      try {
        if (!userId || !validArtworkId(id))
          throw new Error("Result unavailable");
        const client = requireSupabase();
        const { data: row, error: problem } = await client
          .from("ai_results")
          .select(
            "provider,result_json, artworks!ai_results_artwork_id_fkey!inner(image_url,focus_area)",
          )
          .eq("artwork_id", id)
          .eq("user_id", userId)
          .eq("mode", mode)
          .abortSignal(controller.signal)
          .single();
        if (
          problem ||
          !row ||
          !validResult(row.result_json, mode) ||
          (row.provider !== "mock" && row.provider !== "openai")
        )
          throw new Error("Result unavailable");
        const artwork = Array.isArray(row.artworks)
          ? row.artworks[0]
          : row.artworks;
        if (
          !artwork ||
          typeof artwork !== "object" ||
          (artwork.image_url !== null &&
            typeof artwork.image_url !== "string") ||
          (artwork.focus_area !== null &&
            typeof artwork.focus_area !== "string")
        )
          throw new Error("Result unavailable");
        const url = await imageUrl(artwork?.image_url ?? null);
        if (alive) {
          setResult(row.result_json as T);
          setProvider(row.provider);
          setFocus(artwork?.focus_area ?? null);
          setImage(url);
        }
      } catch {
        if (alive)
          setError(
            "We could not open this saved result. Please try again from My Artworks.",
          );
      } finally {
        if (alive) {
          setLoading(false);
          setCompletedRequest(requestKey);
        }
      }
    })();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [id, mode, sample, userId, requestKey]);
  return {
    result: id ? result : sample,
    provider: id ? provider : "mock",
    image: id ? image : undefined,
    focus: id
      ? focus
      : Array.isArray(params.focus)
        ? params.focus[0]
        : params.focus,
    loading: !!id && (loading || completedRequest !== requestKey),
    error: id && completedRequest === requestKey ? error : "",
    warning: Array.isArray(params.warning) ? params.warning[0] : params.warning,
    retry: () => setAttempt((v) => v + 1),
  };
}
