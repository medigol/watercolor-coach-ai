import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, Pressable } from "react-native";
import { colors } from "./theme";
export { colors } from "./theme";
export const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  title: { fontSize: 29, lineHeight: 37, fontWeight: "700", color: colors.ink },
  heading: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "600",
    color: colors.ink,
  },
  body: { fontSize: 16, lineHeight: 25, color: colors.muted },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
        maxWidth: 760,
        alignSelf: "center",
      }}
      contentContainerStyle={styles.content}
    >
      {children}
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
