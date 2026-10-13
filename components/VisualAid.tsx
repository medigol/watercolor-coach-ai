import { StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";

// Deliberate sample shapes: a roof, shoreline, reflection, and tree mass.
// These are illustrative placeholders, not generated guides or artwork.
export default function VisualAid({
  label,
  kind = "landscape",
}: {
  label: string;
  kind?: "landscape" | "sketch" | "values";
}) {
  const sketch = kind === "sketch";
  const values = kind === "values";
  const light = values ? "#F3F2E9" : "#EDF5F4";
  const middle = values ? "#A4ADA8" : "#ACCBC4";
  const dark = values ? "#42534D" : "#628B7D";
  return (
    <View accessible accessibilityLabel={label} style={art.frame}>
      <View
        style={[art.scene, { backgroundColor: sketch ? "#FAF9F3" : light }]}
      >
        {sketch && <View style={art.horizon} />}
        <View
          style={[
            art.water,
            {
              backgroundColor: sketch ? "transparent" : middle,
              borderTopColor: sketch ? "#A6B7AD" : middle,
            },
          ]}
        />
        <View
          style={[
            art.trees,
            {
              backgroundColor: sketch ? "transparent" : dark,
              borderColor: sketch ? "#9CAD9F" : dark,
            },
          ]}
        />
        <View
          style={[
            art.house,
            {
              backgroundColor: sketch ? "#FAF9F3" : light,
              borderColor: sketch ? "#788F82" : light,
            },
          ]}
        />
        <View
          style={[art.roof, { borderBottomColor: sketch ? "#788F82" : dark }]}
        />
        <View
          style={[art.door, { backgroundColor: sketch ? "#788F82" : dark }]}
        />
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              art.reflection,
              {
                top: 112 + i * 10,
                width: 44 - i * 8,
                backgroundColor: sketch ? "#A6B7AD" : dark,
                opacity: 0.4,
              },
            ]}
          />
        ))}
        {values && (
          <View style={art.legend}>
            {[
              [light, "Light"],
              [middle, "Middle"],
              [dark, "Dark"],
            ].map(([color, name]) => (
              <View key={name} style={art.legendItem}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    backgroundColor: color,
                    borderWidth: 1,
                    borderColor: "#889990",
                  }}
                />
                <Text style={art.legendText}>{name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Text style={art.label}>{label}</Text>
    </View>
  );
}
const art = StyleSheet.create({
  frame: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  scene: { height: 178, overflow: "hidden" },
  horizon: {
    position: "absolute",
    top: 86,
    left: 16,
    right: 16,
    borderTopWidth: 1,
    borderColor: "#CAD2C6",
    borderStyle: "dashed",
  },
  water: {
    position: "absolute",
    top: 103,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  trees: {
    position: "absolute",
    top: 40,
    left: "14%",
    width: "32%",
    height: 64,
    borderRadius: 42,
    borderWidth: 1,
    transform: [{ rotate: "-8deg" }],
  },
  house: {
    position: "absolute",
    left: "58%",
    top: 72,
    width: 49,
    height: 34,
    borderWidth: 1,
  },
  roof: {
    position: "absolute",
    left: "58%",
    top: 46,
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 27,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  door: { position: "absolute", left: "66%", top: 88, width: 7, height: 16 },
  reflection: { position: "absolute", left: "59%", height: 2, borderRadius: 2 },
  legend: {
    position: "absolute",
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFFE8",
    padding: 8,
    borderRadius: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendText: { fontSize: 11, color: colors.ink },
  label: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
});
