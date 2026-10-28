import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router, usePathname } from "expo-router";
import { colors } from "../theme";
import { useLearning } from "../../providers/LearningProvider";
import { itemById } from "../../learning/content";
import LearningFocus from "./LearningFocus";
import { studio } from "./design";
export const learnStyles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 25, color: colors.ink },
  muted: { fontSize: 14, lineHeight: 22, color: colors.muted },
  label: {
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 1.2,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: studio.type.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: studio.type.display,
    fontSize: 23,
    lineHeight: 29,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.paper,
    padding: 20,
    borderRadius: studio.radius,
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
  section: {
    gap: 14,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: studio.colors.rule,
  },
});
export function Heading({
  children,
  level = 2,
}: {
  children: ReactNode;
  level?: 1 | 2 | 3;
}) {
  const { width } = useWindowDimensions();
  return (
    <Text
      accessibilityRole="header"
      aria-level={level}
      style={
        level === 1
          ? [
              learnStyles.title,
              width >= 1000 ? { fontSize: 40, lineHeight: 46 } : null,
            ]
          : learnStyles.heading
      }
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
  label,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  selected?: boolean;
  testID?: string;
  label?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled,
        ...(selected === undefined || Platform.OS === "web"
          ? {}
          : { selected }),
      }}
      aria-pressed={selected}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: studio.touch,
        maxWidth: "100%",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: disabled
          ? colors.border
          : secondary
            ? studio.colors.rule
            : colors.accent,
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
        {label ?? title}
      </Text>
    </Pressable>
  );
}
export function TextLink({
  title,
  onPress,
  expanded,
  testID,
  label,
}: {
  title: string;
  onPress: () => void;
  expanded?: boolean;
  testID?: string;
  label?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={expanded === undefined ? {} : { expanded }}
      onPress={onPress}
      style={{
        minHeight: 44,
        maxWidth: "100%",
        flexShrink: 1,
        paddingVertical: 10,
        paddingHorizontal: 4,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: 14,
          lineHeight: 22,
          fontWeight: "600",
          color: colors.accent,
        }}
      >
        {label ?? title}
        {expanded === undefined ? "" : expanded ? " −" : " +"}
      </Text>
    </Pressable>
  );
}
export function Disclosure({
  title,
  children,
  initial = false,
}: {
  title: string;
  children: ReactNode;
  initial?: boolean;
}) {
  const [open, setOpen] = useState(initial);
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderColor: studio.colors.rule,
        gap: open ? 12 : 0,
        paddingVertical: 4,
      }}
    >
      <TextLink
        title={title}
        expanded={open}
        onPress={() => setOpen((v) => !v)}
      />
      {open && <View style={{ gap: 14, paddingBottom: 14 }}>{children}</View>}
    </View>
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
const sections = [
  ["My path", "/learn/path"],
  ["Curriculum", "/learn/curriculum"],
  ["Styles", "/learn/styles"],
  ["Progress", "/learn/progress"],
  ["Preferences", "/learn/onboarding"],
];
export function LearnNav() {
  const { width } = useWindowDimensions(),
    { state } = useLearning(),
    pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const go = (path: string) => {
    setOpen(false);
    router.push(path as never);
  };
  const resume =
    state.currentItemId && itemById(state.currentItemId)
      ? state.currentItemId
      : null;
  return (
    <View
      role="navigation"
      accessibilityLabel="Learning sections"
      testID="learn-section-nav"
      style={{ gap: 8 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <TextLink title="Learn home" onPress={() => go("/learn")} />
        {width >= studio.desktop ? (
          <View style={{ flexDirection: "row", gap: 22 }}>
            {sections.map(([title, path]) => (
              <TextLink key={path} title={title} onPress={() => go(path)} />
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 18 }}>
            <TextLink
              title={open ? "Close learning menu" : "Open learning menu"}
              label="Menu"
              expanded={open}
              onPress={() => setOpen((v) => !v)}
            />
          </View>
        )}
      </View>
      {open && (
        <View
          style={[
            learnStyles.card,
            { borderWidth: 1, borderColor: studio.colors.rule },
          ]}
        >
          {resume && (
            <TextLink
              title="Resume current study"
              onPress={() => {
                setOpen(false);
                router.push({
                  pathname: "/learn/lesson",
                  params: { id: resume },
                });
              }}
            />
          )}
          {sections.map(([title, path]) => (
            <TextLink key={path} title={title} onPress={() => go(path)} />
          ))}
          <Disclosure title="About your learning record">
            <Copy muted>
              Practice is self-reported. Notes and progress stay on this device,
              are not encrypted or synced, and can be lost if browser/app
              storage is cleared. Use a trusted personal device. Changing your
              preferences keeps completed work.
            </Copy>
          </Disclosure>
        </View>
      )}
    </View>
  );
}
export function SaveStatus() {
  const l = useLearning();
  return (
    <View testID="learning-save-status" style={{ gap: 8 }}>
      <Text
        role="status"
        accessibilityLiveRegion="polite"
        style={learnStyles.muted}
      >
        {l.saving
          ? "Saving on this device…"
          : l.saveError
            ? "Not saved. Keep this page open and retry."
            : l.saved
              ? "Saved on this device."
              : "Progress is stored on this device."}
      </Text>
      {l.saveError && (
        <View accessibilityRole="alert" style={{ gap: 8 }}>
          <Copy>{l.saveError}</Copy>
          <Action title="Retry local save" secondary onPress={l.retry} />
        </View>
      )}
    </View>
  );
}
export function LearnScreen({
  children,
  nav = true,
  resetKey,
  scrollRef,
}: {
  children: ReactNode;
  nav?: boolean;
  resetKey?: string;
  scrollRef?: RefObject<ScrollView | null>;
}) {
  const { width } = useWindowDimensions(),
    l = useLearning(),
    internalScroll = useRef<ScrollView>(null);
  const scroll = scrollRef ?? internalScroll;
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [resetKey]);
  return (
    <ScrollView
      ref={scroll}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: width < 375 ? 14 : width >= 1000 ? 32 : 20,
        paddingTop: 8,
        paddingBottom: width >= 1000 ? 36 : 100,
      }}
    >
      <View
        role="main"
        testID="learning-page"
        style={{
          width: "100%",
          maxWidth: studio.measure,
          alignSelf: "center",
          gap: nav ? 20 : 14,
        }}
      >
        <LearningFocus />
        <LearnNav />
        {l.loading ? (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Loading local learning progress"
            style={{ gap: 12 }}
          >
            <ActivityIndicator color={colors.accent} />
            <Copy>Opening your learning studio…</Copy>
          </View>
        ) : l.loadError ? (
          <Card>
            <Heading level={1}>Your saved work is preserved</Heading>
            <Copy>{l.loadError}</Copy>
            <Action title="Retry loading progress" onPress={l.reload} />
            <Action
              title="Keep a local backup and start fresh"
              secondary
              onPress={l.recover}
            />
            <Copy muted>
              The backup stays on this device. No artwork, account or saved
              assessment is changed.
            </Copy>
          </Card>
        ) : (
          <>
            {l.saveError && <SaveStatus />}
            {children}
            {!l.saveError && (
              <View style={{ paddingTop: 12 }}>
                <SaveStatus />
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
