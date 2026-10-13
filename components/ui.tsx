import React, { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
export const colors = {
  background: "#F8FAF8",
  ink: "#243C3A",
  muted: "#5E7370",
  accent: "#326C70",
  pale: "#E8F1EF",
  border: "#DCE7E3",
  blue: "#EAF2F8",
};
export const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  title: { fontSize: 30, lineHeight: 37, fontWeight: "700", color: colors.ink },
  heading: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "600",
    color: colors.ink,
  },
  body: { fontSize: 16, lineHeight: 25, color: colors.muted },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    gap: 12,
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
      style={{ flex: 1, backgroundColor: colors.background }}
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
export function Placeholder({
  label,
  kind = "landscape",
}: {
  label: string;
  kind?: "landscape" | "sketch" | "values";
}) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        height: 156,
        backgroundColor: colors.blue,
        borderRadius: 14,
        overflow: "hidden",
        justifyContent: "flex-end",
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 4,
          paddingHorizontal: 18,
        }}
      >
        {(kind === "values"
          ? ["#E7ECE8", "#9BAFA7", "#415F58"]
          : kind === "sketch"
            ? ["#E1E6DF", "#C1CCC3", "#A5B6AD"]
            : ["#BBDAD9", "#98BDB0", "#729E91"]
        ).map((color, i) => (
          <View
            key={color}
            style={{
              flex: 1,
              height: [42, 72, 55][i],
              backgroundColor: color,
              borderTopLeftRadius: kind === "values" ? 0 : 40,
              borderTopRightRadius: kind === "values" ? 0 : 30,
            }}
          />
        ))}
      </View>
      <Text
        style={{
          padding: 12,
          backgroundColor: "#FFFFFFDD",
          color: colors.muted,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
