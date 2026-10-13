import type { ReactNode } from "react";
import { View } from "react-native";
import { colors } from "./theme";
export default function PaperBackground({ children }: { children: ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.paper, flex: 1, width: "100%" }}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 36 }, (_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: `${(i * 29) % 100}%`,
              top: `${(i * 17) % 100}%`,
              width: 22 + (i % 12),
              height: 1,
              backgroundColor: "#A6906B",
              opacity: 0.045,
              transform: [{ rotate: "-12deg" }],
            }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}
