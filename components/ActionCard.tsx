import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ArtworkThumbnail from "./ArtworkThumbnail";
import { colors, styles } from "./ui";
export default function ActionCard({
  title,
  description,
  onPress,
  tone = "green",
}: {
  title: string;
  description: string;
  onPress: () => void;
  tone?: "green" | "blue";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          padding: 18,
          minHeight: 142,
          backgroundColor: pressed ? colors.pale : colors.paper,
          borderLeftWidth: 3,
          borderLeftColor: tone === "blue" ? "#8DA8AD" : "#9B9E78",
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <ArtworkThumbnail small harbour={tone === "blue"} />
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={[styles.heading, { fontSize: 19, lineHeight: 25 }]}>
            {title}
          </Text>
          <Text style={[styles.body, { fontSize: 14, lineHeight: 22 }]}>
            {description}
          </Text>
        </View>
      </View>
      <Ionicons
        name="arrow-forward"
        size={18}
        color={colors.accent}
        style={{ alignSelf: "flex-end" }}
      />
    </Pressable>
  );
}
