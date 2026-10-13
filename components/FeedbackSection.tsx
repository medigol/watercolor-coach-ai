import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors, styles } from "./ui";
export default function FeedbackSection({
  title,
  text,
  items,
  highlight = false,
  tone,
}: {
  title: string;
  text?: string;
  items?: string[];
  highlight?: boolean;
  tone?: "blue";
}) {
  const accent = title === "What to fix" ? "#A37C4F" : colors.accent;
  return (
    <View
      style={[
        styles.card,
        tone === "blue" && {
          backgroundColor: "#F0F5FB",
          borderColor: colors.border,
        },
        highlight && {
          backgroundColor: "#E5F2EE",
          borderColor: "#CADFD8",
          padding: 24,
          borderLeftWidth: 1,
          borderLeftColor: colors.accent,
        },
      ]}
    >
      <Text
        style={[styles.heading, highlight && { fontSize: 22, lineHeight: 29 }]}
      >
        {title}
      </Text>
      {text && (
        <Text
          style={[
            styles.body,
            highlight && { color: colors.ink, fontSize: 17, lineHeight: 28 },
          ]}
        >
          {text}
        </Text>
      )}
      {items?.map((item, index) => (
        <View
          key={item}
          style={{
            flexDirection: "row",
            gap: 12,
            paddingTop: index ? 12 : 0,
            borderTopWidth: index ? 1 : 0,
            borderTopColor: colors.border,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              marginTop: 1,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                title === "What to fix" ? "#FAF1DF" : colors.pale,
            }}
          >
            <Ionicons
              name={title === "What to fix" ? "arrow-up-outline" : "checkmark"}
              size={15}
              color={accent}
            />
          </View>
          <Text style={[styles.body, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}
