import MiniWatercolorScene, { type StudyKind } from "./MiniWatercolorScene";
import { Text, View } from "react-native";
import { colors, styles } from "./ui";
export default function PaintingStepsCard({ steps }: { steps: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Painting steps</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {(["sketch", "wash", "layers", "painting"] as StudyKind[]).map(
          (kind, i) => (
            <View
              key={kind}
              style={{
                width: "46%",
                borderWidth: 1,
                borderColor: colors.border,
                padding: 5,
              }}
            >
              <MiniWatercolorScene kind={kind} height={64} />
              <Text style={styles.caption}>
                {["Sketch", "First wash", "Middle layers", "Final accents"][i]}
              </Text>
            </View>
          ),
        )}
      </View>
      {steps.map((step, i) => (
        <Text key={step} style={styles.body}>
          {i + 1}. {step}
        </Text>
      ))}
    </View>
  );
}
