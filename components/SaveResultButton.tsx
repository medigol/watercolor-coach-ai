import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import {
  saveArtwork,
  createSaveAttempt,
  liveFeedbackErrorMessage,
  type SaveAttempt,
  type ArtworkImage,
  type SavedMode,
} from "../lib/artworks";
import { useAuth } from "../providers/AuthProvider";
import { Button, styles } from "./ui";
export default function SaveResultButton({
  mode,
  focus,
  image,
  title,
}: {
  mode: SavedMode;
  focus?: string;
  image?: ArtworkImage;
  title: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const request = useRef<{ key: string; attempt: SaveAttempt } | null>(null);
  const active = useRef(false);
  const { session } = useAuth();
  const account = useRef(session?.user.id);
  account.current = session?.user.id;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function save() {
    if (saving.current) return;
    saving.current = true;
    const userId = account.current;
    setBusy(true);
    setError("");
    try {
      const key = JSON.stringify([
        userId,
        mode,
        // Improve Painting's focus is only an initial local view, not another
        // analysis. An uncertain completion must retain its idempotency ID.
        mode === "improve_painting" ? null : (focus ?? null),
        image?.uri ?? null,
      ]);
      if (request.current?.key !== key)
        request.current = { key, attempt: createSaveAttempt() };
      const attempt = request.current.attempt;
      const { id, warning, provider } = await saveArtwork(
        mode,
        focus || null,
        image,
        attempt,
      );
      if (provider !== "openai") throw new Error(liveFeedbackErrorMessage);
      if (!active.current || account.current !== userId) return;
      router.push({
        pathname:
          mode === "improve_painting"
            ? "/result/improve-painting"
            : "/result/create-reference",
        params: { id, ...(warning ? { warning } : {}) },
      });
    } catch (e) {
      if (active.current && account.current === userId)
        setError(e instanceof Error ? e.message : liveFeedbackErrorMessage);
    } finally {
      saving.current = false;
      if (active.current) setBusy(false);
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <Button
        title={busy ? "Preparing…" : title}
        onPress={save}
        disabled={busy}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={styles.body}>
          {error}
        </Text>
      )}
    </View>
  );
}
