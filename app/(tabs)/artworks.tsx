import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { ActivityIndicator, Text } from "react-native";
import ArtworkCard from "../../components/ArtworkCard";
import { Button, Screen, styles, colors } from "../../components/ui";
import { requireSupabase } from "../../lib/supabase";
import { imageUrl, validArtwork, type SavedArtwork } from "../../lib/artworks";
import { useAuth } from "../../providers/AuthProvider";
export default function Artworks() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [items, setItems] = useState<
    (SavedArtwork & { signedImage?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${userId ?? ""}/${attempt}`;
  const [completedRequest, setCompletedRequest] = useState("");
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const controller = new AbortController();
      setLoading(true);
      setError("");
      setItems([]);
      (async () => {
        try {
          if (!userId) throw new Error("Sign in required");
          const { data, error } = await requireSupabase()
            .from("artworks")
            .select("id,mode,title,image_url,focus_area,created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .abortSignal(controller.signal);
          if (error || !Array.isArray(data) || !data.every(validArtwork))
            throw new Error("Artworks unavailable");
          const list = await Promise.all(
            data.map(async (row) => ({
              ...row,
              signedImage: await imageUrl(row.image_url),
            })),
          );
          if (alive) setItems(list);
        } catch {
          if (alive)
            setError("We could not load your artworks. Please try again.");
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
    }, [userId, requestKey]),
  );
  return (
    <Screen>
      <Text style={styles.title}>My Artworks</Text>
      <Text style={styles.body}>Your paintings and saved feedback.</Text>
      {loading || completedRequest !== requestKey ? (
        <ActivityIndicator color={colors.accent} />
      ) : error ? (
        <>
          <Text accessibilityRole="alert" style={styles.body}>
            {error}
          </Text>
          <Button title="Try again" onPress={() => setAttempt((v) => v + 1)} />
        </>
      ) : !items.length ? (
        <Text style={styles.body}>
          No artworks yet. Upload a painting to get your first feedback.
        </Text>
      ) : (
        items.map((item) => (
          <ArtworkCard
            key={item.id}
            imageUri={item.signedImage}
            artwork={{
              id: item.id,
              title: item.title,
              mode:
                item.mode === "improve_painting"
                  ? "Improve painting"
                  : "Create reference",
              summary: item.focus_area || "Saved painting plan",
              date: new Date(item.created_at).toLocaleDateString(),
            }}
            onPress={() =>
              router.push({
                pathname:
                  item.mode === "improve_painting"
                    ? "/result/improve-painting"
                    : "/result/create-reference",
                params: { id: item.id },
              })
            }
          />
        ))
      )}
    </Screen>
  );
}
