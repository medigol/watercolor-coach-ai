import { StyleSheet, Text, View } from "react-native";
import type { BrushWashStep } from "../types";
import { colors, styles } from "./ui";

const fields = [
  "stage",
  "brush",
  "wash",
  "technique",
  "timing",
  "edges",
  "stop",
];
const techniqueLabels = {
  wet_on_wet: "Wet-on-wet",
  wet_on_dry: "Wet-on-dry",
  damp_on_damp: "Damp-on-damp",
} as const;
function shortText(value: unknown, limit: number): value is string {
  return typeof value === "string" && !!value.trim() && value.length <= limit;
}

// Missing optional execution guidance must never block a saved text result.
export function usableBrushPlan(value: unknown): BrushWashStep[] {
  if (!Array.isArray(value)) return [];
  const result: BrushWashStep[] = [];
  for (const item of value.slice(0, 3)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const step = item as Record<string, unknown>;
    if (
      Object.keys(step).some((key) => !fields.includes(key)) ||
      !shortText(step.stage, 60) ||
      !shortText(step.brush, 120) ||
      !shortText(step.wash, 120) ||
      !shortText(step.timing, 120) ||
      !shortText(step.edges, 120) ||
      !shortText(step.stop, 120) ||
      typeof step.technique !== "string" ||
      !Object.hasOwn(techniqueLabels, step.technique)
    )
      continue;
    result.push({
      stage: step.stage.trim(),
      brush: step.brush.trim(),
      wash: step.wash.trim(),
      technique: step.technique as BrushWashStep["technique"],
      timing: step.timing.trim(),
      edges: step.edges.trim(),
      stop: step.stop.trim(),
    });
  }
  return result;
}

function PlanNote({ label, text }: { label: string; text: string }) {
  return (
    <View style={planStyles.note}>
      <Text style={planStyles.label}>{label}</Text>
      <Text style={planStyles.instruction}>{text}</Text>
    </View>
  );
}

export default function BrushWashPlanCard({ plan }: { plan: unknown }) {
  const steps = usableBrushPlan(plan);
  if (!steps.length) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Brush &amp; wash plan</Text>
      <Text style={styles.caption}>
        Let the paper’s moisture guide your next mark.
      </Text>
      {steps.map((step, index) => (
        <View
          key={`${step.stage}-${index}`}
          style={[planStyles.stage, index > 0 && planStyles.divider]}
        >
          <View style={planStyles.stageHeading}>
            <View style={planStyles.number}>
              <Text style={planStyles.numberText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={planStyles.stageName}>{step.stage}</Text>
              <Text style={planStyles.technique}>
                {techniqueLabels[step.technique]}
              </Text>
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <PlanNote label="Brush" text={step.brush} />
            <PlanNote label="Wash" text={step.wash} />
            <PlanNote label="Timing" text={step.timing} />
            <PlanNote label="Edges" text={step.edges} />
          </View>
          <View style={planStyles.stop}>
            <Text style={planStyles.stopLabel}>Stop</Text>
            <Text style={planStyles.instruction}>{step.stop}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const planStyles = StyleSheet.create({
  stage: { gap: 12 },
  divider: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 18 },
  stageHeading: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  number: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.pale,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  stageName: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  technique: { color: colors.accent, fontSize: 12, lineHeight: 18 },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  label: {
    color: colors.muted,
    width: 48,
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "600",
  },
  instruction: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 22 },
  stop: {
    flexDirection: "row",
    gap: 10,
    padding: 11,
    borderRadius: 11,
    backgroundColor: colors.pale,
  },
  stopLabel: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "600",
  },
});
