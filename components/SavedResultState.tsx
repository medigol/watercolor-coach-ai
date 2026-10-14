import CoachingOverlay from "./CoachingOverlay";
import { usableOverlays } from "../lib/overlays";
import { ActivityIndicator, Text, Image } from "react-native";
import { Button, Screen, styles, colors } from "./ui";
import { useState } from "react";
export function ResultState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  return (
    <Screen>
      {loading ? (
        <>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.body}>Opening your feedback…</Text>
        </>
      ) : (
        <>
          <Text accessibilityRole="alert" style={styles.body}>
            {error}
          </Text>
          <Button title="Try again" onPress={retry} />
        </>
      )}
    </Screen>
  );
}
export function SavedImage({
  uri,
  label = "Your painting",
  overlays,
}: {
  uri?: string;
  label?: string;
  overlays?: unknown;
}) {
  const [failedUri, setFailedUri] = useState<string>();
  if (uri && usableOverlays(overlays).length)
    return <CoachingOverlay uri={uri} notes={overlays} label={label} />;
  if (uri && failedUri === uri)
    return (
      <>
        <Text style={styles.caption}>
          Your image is unavailable. Showing text guidance only.
        </Text>
      </>
    );
  return uri ? (
    <>
      <Text style={styles.caption}>{label}</Text>
      <Image
        source={{ uri }}
        accessibilityLabel={label}
        style={{ height: 210, width: "100%", borderRadius: 18 }}
        resizeMode="contain"
        onError={() => setFailedUri(uri)}
      />
    </>
  ) : null;
}
