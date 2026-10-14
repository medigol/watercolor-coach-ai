import WatercolorSwatch from "./WatercolorSwatch";
import { StyleSheet, Text, View } from "react-native";
import type { PaletteColour } from "../types";
import { colors, styles } from "./ui";

const safePigmentCodes = new Set(["PB29", "PBr7", "PY43", "PY42"]);
export function paletteGuidance(color: PaletteColour) {
  const name = color.name.toLowerCase();
  const codeMatchesName =
    (color.pigmentCode === "PB29" && /\bultramarine\b/.test(name)) ||
    (color.pigmentCode === "PBr7" && /\bburnt\s+sienna\b/.test(name)) ||
    (["PY43", "PY42"].includes(color.pigmentCode ?? "") &&
      (/\byellow\s+ochre\b/.test(name) || name.trim() === "ochre"));
  return {
    pigmentCode:
      typeof color.pigmentCode === "string" &&
      safePigmentCodes.has(color.pigmentCode) &&
      codeMatchesName
        ? color.pigmentCode
        : null,
    use:
      typeof color.use === "string" &&
      color.use.trim().length > 0 &&
      color.use.length <= 180
        ? color.use.trim()
        : null,
  };
}

export default function PaletteCard({ palette }: { palette: PaletteColour[] }) {
  const hasCodes = palette.some((color) => paletteGuidance(color).pigmentCode);
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Suggested palette</Text>
      <Text style={styles.caption}>
        Start with fewer colours. Add only what your subject needs.
      </Text>
      <View style={{ gap: 14 }}>
        {palette.map((color, index) => {
          const { pigmentCode, use } = paletteGuidance(color);
          return (
            <View
              key={`${color.name}-${index}`}
              style={paletteStyles.row}
            >
              <WatercolorSwatch color={color.hex} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={paletteStyles.nameRow}>
                  <Text style={paletteStyles.name}>{color.name}</Text>
                  {pigmentCode && (
                    <Text style={paletteStyles.code}>{pigmentCode}</Text>
                  )}
                </View>
                {use && <Text style={styles.caption}>{use}</Text>}
              </View>
            </View>
          );
        })}
      </View>
      <View style={paletteStyles.note}>
        <Text style={styles.caption}>
          Approximate swatches · test your mixes on paper.
        </Text>
        {hasCodes && (
          <Text style={styles.caption}>
            Pigment codes are common guides; paint formulations vary.
          </Text>
        )}
      </View>
    </View>
  );
}

const paletteStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  nameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  name: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: "600" },
  code: {
    color: colors.accent,
    fontSize: 11,
    lineHeight: 19,
    backgroundColor: colors.pale,
    borderRadius: 5,
    overflow: "hidden",
    paddingHorizontal: 6,
  },
  note: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 12, gap: 4 },
});
