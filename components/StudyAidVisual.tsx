import { StyleSheet, View } from "react-native";

/** A reusable shape exercise, deliberately independent of the uploaded subject. */
export default function StudyAidVisual({
  kind,
}: {
  kind: "sketch" | "values";
}) {
  const tonal = kind === "values";
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        tonal
          ? "Abstract sample layout: open light shapes, one connected middle-value mass, and a small dark accent. Adapt these groups to your own image."
          : "Abstract planning sketch: a few connected outlines with open spaces. This is a generic shape exercise, not a sketch of your image."
      }
      style={diagram.paper}
    >
      <View style={diagram.margin} />
      <View
        style={[
          diagram.mainMass,
          tonal ? diagram.middleFill : diagram.outline,
        ]}
      />
      <View
        style={[
          diagram.connectedMass,
          tonal ? diagram.middleFill : diagram.outline,
        ]}
      />
      <View
        style={[
          diagram.openLight,
          !tonal && { borderBottomWidth: 1, borderColor: "#A0ACA5" },
        ]}
      />
      <View
        style={[
          diagram.accent,
          tonal ? diagram.darkFill : diagram.outline,
        ]}
      />
      <View style={diagram.baseline} />
    </View>
  );
}

const diagram = StyleSheet.create({
  paper: {
    width: "100%",
    aspectRatio: 1.85,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#F7F5EC",
    borderWidth: 1,
    borderColor: "#E7E7DD",
  },
  margin: {
    position: "absolute",
    top: "9%",
    bottom: "9%",
    left: "5%",
    right: "5%",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DFE2D8",
    borderRadius: 4,
  },
  mainMass: {
    position: "absolute",
    top: "38%",
    left: "14%",
    width: "59%",
    height: "41%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 11,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 18,
  },
  connectedMass: {
    position: "absolute",
    top: "24%",
    left: "44%",
    width: "35%",
    height: "48%",
    borderTopLeftRadius: 13,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 11,
    borderBottomLeftRadius: 12,
  },
  openLight: {
    position: "absolute",
    top: "38%",
    left: "29%",
    width: "21%",
    height: "19%",
    backgroundColor: "#F7F5EC",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 16,
  },
  accent: {
    position: "absolute",
    top: "49%",
    left: "64%",
    width: "11%",
    height: "26%",
    borderRadius: 7,
  },
  outline: {
    borderWidth: 1.25,
    borderColor: "#768D85",
    backgroundColor: "#F0F2E9",
  },
  middleFill: { backgroundColor: "#A4AAA0" },
  darkFill: { backgroundColor: "#475952" },
  baseline: {
    position: "absolute",
    left: "16%",
    bottom: "15%",
    width: "62%",
    height: 1,
    backgroundColor: "#C8D0C4",
  },
});
