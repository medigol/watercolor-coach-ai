import { Text, View } from "react-native";
import { PaletteColour } from "../types";
import { styles } from "./ui";
export default function PaletteCard({ palette }: { palette: PaletteColour[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Suggested palette</Text>
      {palette.map((color) => (
        <View
          key={color.name}
          style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: color.hex,
            }}
          />
          <Text style={[styles.body, { flex: 1 }]}>{color.name}</Text>
        </View>
      ))}
    </View>
  );
}
