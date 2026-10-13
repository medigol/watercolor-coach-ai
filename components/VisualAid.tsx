import { Text, View } from "react-native";
import MiniWatercolorScene from "./MiniWatercolorScene";
import { colors } from "./theme";
export default function VisualAid({
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
        borderWidth: 1,
        borderColor: colors.border,
        padding: 8,
        backgroundColor: colors.paper,
      }}
    >
      <MiniWatercolorScene
        harbour={!label.includes("Lake House")}
        kind={kind === "landscape" ? "painting" : kind}
      />
      <Text
        style={{
          fontSize: 11,
          lineHeight: 17,
          color: colors.muted,
          marginTop: 8,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
