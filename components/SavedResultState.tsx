import { ActivityIndicator, Text, Image } from "react-native";
import { Button, Screen, styles, colors } from "./ui";
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
export function SavedImage({ uri }: { uri?: string }) {
  return uri ? (
    <Image
      source={{ uri }}
      accessibilityLabel="Saved artwork"
      style={{ height: 210, width: "100%", borderRadius: 18 }}
      resizeMode="contain"
    />
  ) : null;
}
