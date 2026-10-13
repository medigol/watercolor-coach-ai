import type { ReactNode } from "react";
import { View } from "react-native";
import { colors } from "./theme";
export default function PaperBackground({ children }: { children: ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.background, width: "100%" }}>
      {children}
    </View>
  );
}
