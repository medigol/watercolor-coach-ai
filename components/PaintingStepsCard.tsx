import { StyleSheet, Text, View } from "react-native";
import { colors, styles } from "./ui";

export function splitPaintingStep(step: string) {
  // New guidance can name a stage; older saved strings remain untouched.
  const match = /^([^:.!?\n]{2,38}):\s+(.+)$/s.exec(step);
  if (!match || match[1].trim().split(/\s+/).length > 6)
    return { stage: null, instruction: step };
  return { stage: match[1].trim(), instruction: match[2] };
}

export default function PaintingStepsCard({ steps }: { steps: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Painting steps</Text>
      <Text style={styles.caption}>
        Follow the sequence; check paper moisture before each wash.
      </Text>
      {steps.map((step, i) => {
        const { stage, instruction } = splitPaintingStep(step);
        return (
          <View
            key={i}
            style={[
              stepStyles.row,
              i > 0 && stepStyles.divider,
            ]}
          >
            <View style={stepStyles.number}>
              <Text style={stepStyles.numberText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              {stage && <Text style={stepStyles.stage}>{stage}</Text>}
              <Text style={styles.body}>{instruction}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  divider: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 16 },
  number: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.pale,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  numberText: { color: colors.accent, fontWeight: "700", fontSize: 13 },
  stage: { color: colors.ink, fontSize: 16, lineHeight: 24, fontWeight: "600" },
});
