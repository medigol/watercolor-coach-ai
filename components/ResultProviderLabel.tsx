import { Text, View } from "react-native";
import type { ResultProvider } from "../lib/artworks";
import { colors, styles } from "./ui";

export default function ResultProviderLabel({
  provider,
  isSaved,
}: {
  provider: ResultProvider;
  isSaved: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={[
          styles.caption,
          {
            color: provider === "mock" ? "#826244" : colors.accent,
            fontWeight: "600",
          },
        ]}
      >
        {provider === "mock"
          ? "Sample guide shown — live AI feedback was unavailable."
          : "AI feedback"}
      </Text>
      {isSaved && <Text style={styles.caption}>Saved result</Text>}
    </View>
  );
}
