import { StyleSheet, View } from "react-native";

const paperMarks = [
  { left: 20, top: 24, width: 12 },
  { left: 48, top: 28, width: 9 },
  { left: 30, top: 44, width: 15 },
  { left: 54, top: 49, width: 7 },
];

export default function WatercolorSwatch({
  color,
  label,
}: {
  color: string;
  label?: string;
}) {
  const pigment = /^#[0-9a-f]{6}$/i.test(color) ? color : "#9AA9A0";
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        label
          ? `${label} · approximate watercolor wash`
          : "Approximate watercolor colour wash"
      }
      style={swatch.paper}
    >
      <View style={[swatch.softEdge, { backgroundColor: pigment }]} />
      <View style={[swatch.wash, { backgroundColor: pigment }]} />
      <View style={[swatch.wetLayer, { backgroundColor: pigment }]} />
      <View style={[swatch.pooledPigment, { backgroundColor: pigment }]} />
      {paperMarks.map((mark, index) => (
        <View key={index} style={[swatch.paperGrain, mark]} />
      ))}
      <View style={swatch.paperLight} />
    </View>
  );
}

const swatch = StyleSheet.create({
  paper: {
    width: 88,
    height: 72,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: "#F8F7F0",
    borderWidth: 1,
    borderColor: "#EBEDE4",
  },
  softEdge: {
    position: "absolute",
    left: 7,
    top: 11,
    width: 73,
    height: 50,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 17,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 25,
    opacity: 0.15,
    transform: [{ rotate: "-7deg" }],
  },
  wash: {
    position: "absolute",
    left: 10,
    top: 14,
    width: 67,
    height: 44,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 21,
    opacity: 0.62,
    transform: [{ rotate: "-4deg" }],
  },
  wetLayer: {
    position: "absolute",
    left: 15,
    top: 18,
    width: 57,
    height: 35,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 17,
    borderBottomLeftRadius: 21,
    borderBottomRightRadius: 11,
    opacity: 0.18,
    transform: [{ rotate: "3deg" }],
  },
  pooledPigment: {
    position: "absolute",
    left: 57,
    top: 31,
    width: 16,
    height: 24,
    borderRadius: 13,
    opacity: 0.19,
    transform: [{ rotate: "-16deg" }],
  },
  paperGrain: {
    position: "absolute",
    height: 1,
    backgroundColor: "#FFFFFF",
    opacity: 0.24,
    transform: [{ rotate: "-7deg" }],
  },
  paperLight: {
    position: "absolute",
    left: 18,
    top: 22,
    width: 19,
    height: 13,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    opacity: 0.1,
  },
});
