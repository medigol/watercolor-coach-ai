import { View } from "react-native";
export default function WatercolorSwatch({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 45,
        height: 35,
        backgroundColor: "#F5F7F3",
        padding: 4,
        borderRadius: 10,
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 9,
          backgroundColor: color,
          opacity: 0.7,
          transform: [{ rotate: "-6deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 10,
          right: 5,
          top: 7,
          height: 17,
          borderRadius: 10,
          backgroundColor: color,
          opacity: 0.3,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 8,
          top: 9,
          width: 16,
          height: 1,
          backgroundColor: "#FFFFFF",
          opacity: 0.45,
        }}
      />
    </View>
  );
}
