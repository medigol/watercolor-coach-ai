import { Platform } from "react-native";
import { colors } from "../theme";
export const studio = {
  colors: { ...colors, rule: "#CCD8D0", wash: "#E3ECE5", clay: "#8E573F" },
  type: {
    display:
      Platform.OS === "web"
        ? "Georgia"
        : Platform.OS === "ios"
          ? "Georgia"
          : "serif",
    body: 16,
    small: 14,
  },
  space: { small: 8, control: 12, section: 24, wide: 36 },
  measure: 1180,
  desktop: 1000,
  radius: 14,
  touch: 48,
};
