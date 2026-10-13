import { Text, View } from "react-native";
import MiniWatercolorScene from "./MiniWatercolorScene";
import { colors, serif } from "./theme";
export default function WatercolorWashHeader() {
  return (
    <View
      style={{
        gap: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          letterSpacing: 2.5,
          color: colors.accent,
          fontWeight: "600",
        }}
      >
        A WATERCOLOR SKETCHBOOK
      </Text>
      <Text
        style={{
          fontFamily: serif,
          fontSize: 34,
          lineHeight: 40,
          color: colors.ink,
        }}
      >
        Watercolor Coach AI
      </Text>
      <MiniWatercolorScene height={114} />
      <Text style={{ fontSize: 16, lineHeight: 25, color: colors.muted }}>
        Upload your painting. Get clear feedback. Know what to practise next.
      </Text>
    </View>
  );
}
