import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ArtworkThumbnail from "./ArtworkThumbnail";
import type { Artwork } from "../types";
import { colors, styles } from "./ui";
export default function ArtworkCard({
  artwork,
  onPress,
}: {
  artwork: Artwork;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { padding: 18, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <ArtworkThumbnail harbour={artwork.mode === "Create reference"} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={[styles.heading, { flex: 1 }]}>{artwork.title}</Text>
        <Ionicons
          name="ellipsis-horizontal"
          size={20}
          color={colors.muted}
          accessible={false}
        />
      </View>
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor:
            artwork.mode === "Create reference" ? colors.blue : colors.pale,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 9,
        }}
      >
        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>
          {artwork.mode}
        </Text>
      </View>
      <Text style={styles.body}>{artwork.summary}</Text>
      <Text style={styles.caption}>{artwork.date}</Text>
    </Pressable>
  );
}
