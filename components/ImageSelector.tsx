import { useState } from "react";
import { Image, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Placeholder, styles } from "./ui";
export default function ImageSelector({
  sample,
  label,
  onSelect,
}: {
  sample: string;
  label: string;
  onSelect?: (image: { uri: string; mimeType?: string | null }) => void;
}) {
  const [uri, setUri] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
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
      setError("We could not open your photos. You can still use the sample.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={styles.card}>
      {uri ? (
        <Image
          source={{ uri }}
          accessibilityLabel="Selected image preview"
          style={{ width: "100%", height: 200, borderRadius: 14 }}
          resizeMode="contain"
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
        Your image is saved privately with your feedback when you continue.
        Results still use the sample guide.
      </Text>
    </View>
  );
}
