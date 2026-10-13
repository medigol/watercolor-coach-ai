import MiniWatercolorScene, { type StudyKind } from "./MiniWatercolorScene";
import { Text, View } from "react-native";
import { colors, styles } from "./ui";
const kinds: StudyKind[] = ["sketch", "wash", "layers", "layers", "painting"];
export default function PaintingStepsCard({ steps }: { steps: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Painting steps</Text>
      {steps.map((step, i) => (
        <View
          key={step}
          style={{
            gap: 12,
            paddingTop: i ? 18 : 0,
            borderTopWidth: i ? 1 : 0,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 78, borderRadius: 12, overflow: "hidden" }}>
              <MiniWatercolorScene kind={kinds[i] || "painting"} height={62} />
            </View>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                backgroundColor: colors.pale,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.accent, fontWeight: "700" }}>
                {i + 1}
              </Text>
            </View>
          </View>
          <Text style={styles.body}>{step}</Text>
        </View>
      ))}
    </View>
  );
}
