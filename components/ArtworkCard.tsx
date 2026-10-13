import ArtworkThumbnail from "./ArtworkThumbnail";
import { Pressable, Text } from "react-native";
import { Artwork } from "../types";
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
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
    >
      <ArtworkThumbnail harbour={artwork.mode === "Create reference"} />
      <Text style={styles.heading}>{artwork.title}</Text>
      <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "600" }}>
        {artwork.mode}
      </Text>
      <Text style={styles.body}>{artwork.summary}</Text>
      <Text style={styles.caption}>{artwork.date}</Text>
    </Pressable>
  );
}
