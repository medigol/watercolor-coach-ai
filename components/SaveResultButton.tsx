import { useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { saveArtwork, type SavedMode } from "../lib/artworks";
import { Button, styles } from "./ui";
export default function SaveResultButton({
  mode,
  focus,
  image,
  title,
}: {
  mode: SavedMode;
  focus?: string;
  image?: { uri: string; mimeType?: string | null };
  title: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { id, warning } = await saveArtwork(mode, focus || null, image);
      router.push({
        pathname:
          mode === "improve_painting"
            ? "/result/improve-painting"
            : "/result/create-reference",
        params: { id, ...(warning ? { warning } : {}) },
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We could not save your result. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <Button title={busy ? "Saving…" : title} onPress={save} disabled={busy} />
      {!!error && (
        <Text accessibilityRole="alert" style={styles.body}>
          {error}
        </Text>
      )}
    </View>
  );
}
