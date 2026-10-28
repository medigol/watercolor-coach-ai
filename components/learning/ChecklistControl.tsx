import { Pressable, Text } from "react-native";
import { colors } from "../theme";
export interface ChecklistControlProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}
export default function ChecklistControl({
  label,
  checked,
  onToggle,
}: ChecklistControlProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={{
        minHeight: 48,
        padding: 13,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: checked ? colors.accent : colors.border,
        backgroundColor: checked ? colors.pale : colors.paper,
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
      }}
    >
      <Text
        accessibilityElementsHidden
        style={{ fontSize: 21, color: colors.accent }}
      >
        {checked ? "☑" : "☐"}
      </Text>
      <Text
        style={{ flex: 1, fontSize: 16, lineHeight: 26, color: colors.ink }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
