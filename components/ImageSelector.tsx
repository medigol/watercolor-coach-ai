import { useState } from "react";
import { Image, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Placeholder, styles } from "./ui";
import type { ArtworkImage } from "../lib/artworks";
export default function ImageSelector({
  sample,
  label,
  onSelect,
}: {
  sample: string;
  label: string;
  onSelect?: (image: ArtworkImage) => void;
}) {
  const [uri, setUri] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [failedUri, setFailedUri] = useState<string>();
  async function select() {
    setBusy(true);
    setError(undefined);
    try {
      // The system photo picker does not require full library access.
      // Open it directly from the press event to preserve web user activation.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setUri(result.assets[0].uri);
        onSelect?.(result.assets[0]);
      }
    } catch {
      setError(
        "We could not open your photos. Please try choosing an image again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={styles.card}>
      {uri && failedUri !== uri ? (
        <Image
          source={{ uri }}
          accessibilityLabel="Selected image preview"
          style={{ width: "100%", height: 200, borderRadius: 14 }}
          resizeMode="contain"
          onError={() => {
            setFailedUri(uri);
            setError(
              "We could not preview this image. Please choose another image if feedback cannot be prepared.",
            );
          }}
        />
      ) : (
        <Placeholder label={sample} />
      )}
      <Button
        title={busy ? "Opening photos…" : uri ? "Choose another image" : label}
        onPress={select}
        disabled={busy}
      />
      {error && (
        <Text accessibilityRole="alert" style={styles.caption}>
          {error}
        </Text>
      )}
      <Text style={styles.caption}>
        Your image is stored privately for feedback. If feedback cannot be
        prepared, you can retry here.
      </Text>
    </View>
  );
}
