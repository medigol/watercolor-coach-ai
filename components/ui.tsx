import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { colors } from "./theme";
export { colors } from "./theme";
export const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
  },
  title: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.ink,
  },
  heading: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "600",
    color: colors.ink,
  },
  body: { fontSize: 16, lineHeight: 25, color: colors.muted },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 22,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#234641",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.035,
    shadowRadius: 16,
    elevation: 1,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 18,
    minHeight: 56,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 17 },
  caption: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        width: "100%",
        maxWidth: 430,
        alignSelf: "center",
      }}
      contentContainerStyle={styles.content}
    >
      <View style={{ gap: 20 }}>{children}</View>
    </ScrollView>
  );
}
export function Button({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}
export { default as Placeholder } from "./VisualAid";
