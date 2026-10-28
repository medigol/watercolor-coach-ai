import { useEffect, useRef, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { colors } from "../theme";
import { useLearning } from "../../providers/LearningProvider";
import LearningFocus from "./LearningFocus";
export const learnStyles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 26, color: colors.ink },
  muted: { fontSize: 14, lineHeight: 22, color: colors.muted },
  label: {
    fontSize: 12,
    lineHeight: 19,
    letterSpacing: 1.4,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -0.8,
    fontWeight: "700",
    color: colors.ink,
  },
  heading: {
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.3,
    fontWeight: "600",
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.paper,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 10,
    padding: 14,
    minHeight: 100,
    fontSize: 16,
    lineHeight: 25,
    color: colors.ink,
    backgroundColor: colors.paper,
    textAlignVertical: "top",
  },
});
export function Heading({
  children,
  level = 2,
}: {
  children: ReactNode;
  level?: 1 | 2 | 3;
}) {
  return (
    <Text
      accessibilityRole="header"
      aria-level={level}
      style={level === 1 ? learnStyles.title : learnStyles.heading}
    >
      {children}
    </Text>
  );
}
export function Copy({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <Text style={muted ? learnStyles.muted : learnStyles.body}>{children}</Text>
  );
}
export function Action({
  title,
  onPress,
  secondary = false,
  disabled = false,
  selected,
  testID,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  selected?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled,
        ...(selected === undefined ? {} : { selected }),
      }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingVertical: 13,
        paddingHorizontal: 17,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: disabled ? colors.border : colors.accent,
        backgroundColor: selected || !secondary ? colors.accent : colors.paper,
        opacity: disabled ? 0.55 : pressed ? 0.8 : 1,
        justifyContent: "center",
        alignItems: "center",
      })}
    >
      <Text
        style={{
          fontSize: 15,
          lineHeight: 22,
          fontWeight: "600",
          color: selected || !secondary ? "#fff" : colors.accent,
          textAlign: "center",
        }}
      >
        {selected ? "✓ " : ""}
        {title}
      </Text>
    </Pressable>
  );
}
export function Choices({
  values,
  selected,
  onSelect,
}: {
  values: { id: string; label: string }[];
  selected: string | string[];
  onSelect: (id: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {values.map((v) => (
        <Action
          key={v.id}
          title={v.label}
          secondary
          selected={
            Array.isArray(selected)
              ? selected.includes(v.id)
              : selected === v.id
          }
          onPress={() => onSelect(v.id)}
        />
      ))}
    </View>
  );
}
export function Card({ children }: { children: ReactNode }) {
  return <View style={learnStyles.card}>{children}</View>;
}
export function LearnNav() {
  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel="Learning navigation"
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
    >
      {[
        ["Learn home", "/learn"],
        ["My path", "/learn/path"],
        ["Curriculum", "/learn/curriculum"],
        ["Styles", "/learn/styles"],
        ["Progress", "/learn/progress"],
      ].map(([title, path]) => (
        <Action
          key={path}
          title={title}
          secondary
          onPress={() => router.push(path as never)}
        />
      ))}
    </View>
  );
}
export function SaveStatus() {
  const learning = useLearning();
  return (
    <View style={{ gap: 8 }}>
      <Text
        role="status"
        accessibilityLiveRegion="polite"
        style={learnStyles.muted}
      >
        {learning.saving
          ? "Saving on this device…"
          : learning.saveError
            ? "Not saved. Keep this page open and retry."
            : learning.saved
              ? "Saved on this device."
              : "Progress stays in this browser or app on this device."}{" "}
        Not synced across devices.
      </Text>
      {learning.saveError && (
        <View accessibilityRole="alert" style={{ gap: 8 }}>
          <Copy>{learning.saveError}</Copy>
          <Action title="Retry local save" secondary onPress={learning.retry} />
        </View>
      )}
    </View>
  );
}
export function LearnScreen({
  children,
  nav = true,
  resetKey,
}: {
  children: ReactNode;
  nav?: boolean;
  resetKey?: string;
}) {
  const { width } = useWindowDimensions();
  const learning = useLearning();
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [resetKey]);
  return (
    <ScrollView
      ref={scroll}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: width < 375 ? 14 : width >= 1000 ? 32 : 20,
        paddingBottom: 120,
      }}
    >
      <View
        role="main"
        testID="learning-page"
        style={{ width: "100%", maxWidth: 1140, alignSelf: "center", gap: 24 }}
      >
        <LearningFocus />
        {nav && <LearnNav />}
        {learning.loading ? (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading local learning progress"
            style={{ gap: 12 }}
          >
            <ActivityIndicator color={colors.accent} />
            <Copy>Opening your learning studio…</Copy>
          </View>
        ) : learning.loadError ? (
          <Card>
            <Heading level={1}>Your saved work is preserved</Heading>
            <Copy>{learning.loadError}</Copy>
            <Action title="Retry loading progress" onPress={learning.reload} />
            <Action
              title="Keep a local backup and start fresh"
              secondary
              onPress={learning.recover}
            />
            <Copy muted>
              The backup stays on this device. No artwork, account or saved
              assessment is changed.
            </Copy>
          </Card>
        ) : (
          <>
            <SaveStatus />
            {children}
          </>
        )}
      </View>
    </ScrollView>
  );
}
