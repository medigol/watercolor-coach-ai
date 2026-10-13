import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "./theme";
export default function WatercolorWashHeader() {
  return (
    <View
      style={{
        padding: 24,
        gap: 16,
        backgroundColor: "#EAF3F2",
        borderRadius: 28,
        overflow: "hidden",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: -42,
          top: -20,
          width: 180,
          height: 170,
          borderRadius: 90,
          backgroundColor: "#B6D9DC",
          opacity: 0.32,
          transform: [{ rotate: "-22deg" }],
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: 38,
          bottom: -90,
          width: 220,
          height: 150,
          borderRadius: 90,
          backgroundColor: "#C8DDC6",
          opacity: 0.32,
        }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 11,
            backgroundColor: "#FFFFFFB3",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="color-palette-outline"
            size={19}
            color={colors.accent}
          />
        </View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.accent,
            letterSpacing: 0.4,
          }}
        >
          YOUR WATERCOLOR PRACTICE
        </Text>
      </View>
      <Text
        style={{
          fontSize: 31,
          lineHeight: 37,
          letterSpacing: -1,
          fontWeight: "700",
          color: colors.ink,
        }}
      >
        Watercolor Coach AI
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 25, color: colors.muted }}>
        Upload your painting. Get clear feedback. Know what to practise next.
      </Text>
    </View>
  );
}
