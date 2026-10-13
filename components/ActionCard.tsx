import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles } from "./ui";
export default function ActionCard({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          padding: 24,
          minHeight: 165,
          backgroundColor: pressed ? colors.pale : "#FFFFFF",
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text style={[styles.heading, { flex: 1 }]}>{title}</Text>
        <Ionicons name="arrow-forward" size={22} color={colors.accent} />
      </View>
      <Text style={styles.body}>{description}</Text>
    </Pressable>
  );
}
