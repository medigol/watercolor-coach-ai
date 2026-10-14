import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import FeedbackSection from "./FeedbackSection";
import { colors, styles } from "./ui";
export default function FeedbackDetails({
  works,
  fixes,
}: {
  works: string[];
  fixes: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="What works and what to fix"
        aria-expanded={open}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={[
          styles.card,
          {
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
        ]}
      >
        <View style={{ gap: 4, flex: 1 }}>
          <Text style={[styles.heading, { fontSize: 17 }]}>
            What works &amp; what to fix
          </Text>
          <Text style={styles.caption}>
            Keep the strengths. Avoid competing detail.
          </Text>
        </View>
        <Text style={{ color: colors.accent, fontSize: 22 }}>
          {open ? "−" : "+"}
        </Text>
      </Pressable>
      {open && (
        <>
          <FeedbackSection title="What works" items={works} />
          <FeedbackSection title="What to fix" items={fixes} />
        </>
      )}
    </View>
  );
}
