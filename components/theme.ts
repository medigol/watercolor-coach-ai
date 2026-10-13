import { Platform } from "react-native";
export const colors = {
  background: "#F4EFE5",
  paper: "#FFFCF4",
  ink: "#343E3B",
  muted: "#72766C",
  accent: "#4B7170",
  pale: "#E5EBDF",
  border: "#DED8CB",
  blue: "#E4EBEC",
  ochre: "#B18D53",
  sienna: "#A56F55",
};
export const serif = Platform.select({
  ios: "Georgia",
  web: "Georgia",
  default: "serif",
});
