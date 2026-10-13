import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import {
  saveArtwork,
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
      const { id, warning } = await saveArtwork(mode, focus || null, image);
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
        setError(
          e instanceof Error
            ? e.message
            : "We could not save your result. Please try again.",
        );
    } finally {
      saving.current = false;
      if (active.current) setBusy(false);
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
