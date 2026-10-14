import { useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { colors, styles } from "./ui";

export default function StudyDisclosure({
  title,
  helper,
  children,
  initiallyOpen,
  open: controlledOpen,
  onOpenChange,
}: {
  title: string;
  helper?: string;
  children: ReactNode;
  initiallyOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { width } = useWindowDimensions();
  const [choice, setChoice] = useState<boolean>();
  const open =
    controlledOpen ??
    choice ??
    initiallyOpen ??
    (Platform.OS === "web" && width >= 960);
  return (
    <View style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => {
          if (controlledOpen === undefined) setChoice(!open);
          onOpenChange?.(!open);
        }}
        style={[
          styles.card,
          {
            padding: 16,
            minHeight: 56,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          },
        ]}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.heading, { fontSize: 16 }]}>{title}</Text>
          {!!helper && <Text style={styles.caption}>{helper}</Text>}
        </View>
        <Text
          accessible={false}
          aria-hidden
          style={{ color: colors.accent, fontSize: 20 }}
        >
          {open ? "−" : "+"}
        </Text>
      </Pressable>
      {open && children}
    </View>
  );
}
