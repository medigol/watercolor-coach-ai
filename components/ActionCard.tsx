import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles } from "./ui";
export default function ActionCard({
  title,
  description,
  onPress,
  tone = "green",
  icon = "brush-outline",
}: {
  title: string;
  description: string;
  onPress: () => void;
  tone?: "green" | "blue";
  icon?: "brush-outline" | "image-outline";
}) {
  const tint = tone === "blue" ? "#EDF3F8" : "#EDF4F0";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          padding: 22,
          minHeight: 176,
          backgroundColor: pressed ? colors.pale : tint,
          borderColor: tone === "blue" ? "#D9E5EF" : "#D5E5DC",
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            backgroundColor: "#FFFFFFCC",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={24} color={colors.accent} />
        </View>
        <Ionicons name="arrow-forward" size={21} color={colors.accent} />
      </View>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.body}>{description}</Text>
    </Pressable>
  );
}
