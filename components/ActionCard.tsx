import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const blue = tone === "blue";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          padding: 24,
          minHeight: 185,
          backgroundColor: pressed ? colors.pale : blue ? "#F0F5FC" : "#F0F6F1",
          borderColor: blue ? "#E0E9F4" : "#DFEAE1",
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: blue ? "#DFEAF7" : "#DDEEE3",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={blue ? "images-outline" : "brush-outline"}
            size={24}
            color={blue ? "#547AA5" : colors.accent}
          />
        </View>
        <Ionicons name="arrow-forward" size={22} color={colors.accent} />
      </View>
      <View style={{ gap: 8 }}>
        <Text style={[styles.heading, { fontSize: 21, lineHeight: 28 }]}>
          {title}
        </Text>
        <Text style={styles.body}>{description}</Text>
      </View>
    </Pressable>
  );
}
