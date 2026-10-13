import { View } from "react-native";
import { colors } from "./theme";
export type StudyKind = "painting" | "sketch" | "values" | "wash" | "layers";
export default function MiniWatercolorScene({
  kind = "painting",
  harbour = true,
  height = 132,
}: {
  kind?: StudyKind;
  harbour?: boolean;
  height?: number;
}) {
  const sketch = kind === "sketch";
  const values = kind === "values";
  const wash = kind === "wash";
  const dark = values ? "#4D514C" : sketch ? "#847D6D" : "#456767";
  const mid = values ? "#A4A399" : "#9AB6B5";
  const light = values ? "#EAE6DA" : "#E1E9E4";
  const buildings = harbour ? [22, 35, 46, 60, 72] : [61];
  return (
    <View
      pointerEvents="none"
      style={{
        height,
        width: "100%",
        overflow: "hidden",
        backgroundColor: kind === "sketch" ? "#FAFBF8" : "#F1F6F3",
        borderRadius: 12,
      }}
    >
      {!sketch && (
        <>
          <View
            style={{
              position: "absolute",
              left: "-12%",
              top: "5%",
              width: "125%",
              height: "48%",
              backgroundColor: light,
              borderRadius: 90,
              opacity: 0.7,
              transform: [{ rotate: "-4deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              left: "-6%",
              top: "22%",
              width: "84%",
              height: "32%",
              backgroundColor: mid,
              borderRadius: 80,
              opacity: 0.2,
              transform: [{ rotate: "5deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              left: "-10%",
              right: "-8%",
              top: "57%",
              height: "35%",
              backgroundColor: mid,
              borderRadius: 55,
              opacity: 0.45,
              transform: [{ rotate: "-3deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              left: "12%",
              top: "68%",
              width: "67%",
              height: "18%",
              backgroundColor: dark,
              borderRadius: 80,
              opacity: 0.09,
            }}
          />
        </>
      )}
      {!wash &&
        buildings.map((left, i) => (
          <View
            key={left}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: `${39 - (i % 3) * 8}%`,
              width: harbour ? "12%" : "20%",
              height: `${22 + (i % 3) * 8}%`,
              backgroundColor: sketch
                ? "transparent"
                : values
                  ? mid
                  : i % 2
                    ? "#C7AC83"
                    : "#D5C7AF",
              borderWidth: sketch ? 1 : 0,
              borderColor: dark,
              opacity: sketch ? 0.8 : 0.85,
              transform: [{ rotate: i % 2 ? "1deg" : "-1deg" }],
            }}
          >
            <View
              style={{
                position: "absolute",
                top: 0,
                left: -2,
                right: -2,
                height: 3,
                backgroundColor: dark,
                opacity: 0.5,
              }}
            />
            {kind !== "layers" && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "40%",
                  width: 4,
                  height: "30%",
                  backgroundColor: dark,
                  opacity: 0.7,
                }}
              />
            )}
          </View>
        ))}
      {!harbour && !wash && (
        <View
          style={{
            position: "absolute",
            left: "12%",
            top: "28%",
            width: "38%",
            height: "33%",
            borderRadius: 50,
            backgroundColor: sketch ? "transparent" : dark,
            borderWidth: sketch ? 1 : 0,
            borderColor: dark,
            opacity: 0.55,
          }}
        />
      )}
      {!wash && (
        <View
          style={{
            position: "absolute",
            left: "11%",
            right: "9%",
            top: "61%",
            height: 2,
            backgroundColor: dark,
            opacity: 0.5,
            transform: [{ rotate: "-3deg" }],
          }}
        />
      )}
      {Array.from({ length: 5 }, (_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: `${71 + i * 4}%`,
            left: `${18 + i * 9}%`,
            width: `${24 - i * 3}%`,
            height: 1,
            backgroundColor: dark,
            opacity: sketch ? 0.35 : 0.18,
          }}
        />
      ))}
      {harbour && !wash && kind !== "layers" && (
        <>
          <View
            style={{
              position: "absolute",
              left: "24%",
              top: "77%",
              width: "13%",
              height: 4,
              backgroundColor: dark,
              borderBottomLeftRadius: 9,
              borderBottomRightRadius: 9,
              transform: [{ rotate: "-4deg" }],
            }}
          />
          <View
            style={{
              position: "absolute",
              left: "30%",
              top: "65%",
              width: 1,
              height: "13%",
              backgroundColor: dark,
              opacity: 0.7,
            }}
          />
          {[53, 58].map((left) => (
            <View
              key={left}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: "57%",
                width: 2,
                height: 7,
                backgroundColor: dark,
                borderRadius: 2,
              }}
            />
          ))}
        </>
      )}
    </View>
  );
}
