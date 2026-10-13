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
          backgroundColor: "#F0F5F9",
          borderColor: "#D9E5EF",
        },
        highlight && {
          backgroundColor: "#E8F2EB",
          borderColor: "#C5DBCB",
          padding: 24,
          borderLeftWidth: 4,
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
              marginTop: 8,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: accent,
            }}
          />
          <Text style={[styles.body, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}
