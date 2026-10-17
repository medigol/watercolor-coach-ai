import { suggestedMethodText } from "../shared/coachingEvidence";
import { cleanDisplayText } from "../shared/coachingDisplay";
import { StyleSheet, Text, View } from "react-native";
import type { BrushWashStep } from "../types";
import { colors, styles } from "./ui";
import {
  conciseText,
  studyText,
  uniqueGuidance,
} from "../lib/coachingPresentation";

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

function suggestedMethod(value: string): string {
  // A finished image supports appearance observations, not a known original
  // brush, moisture state, pigment or sequence. Keep supplied practice cues.
  const originalProcess =
    /\b(?:artist|painter|you|they)\s+(?:(?:clearly|definitely|originally)\s+)?(?:used|chose|painted|worked|applied|mixed|began|finished|soaked|glazed|layered)\b|\b(?:was|were|had been|has been|must have been)\s+(?:(?:clearly|definitely|originally|fully|still|evenly)\s+)?(?:painted|applied|used|mixed|laid|brushed|wet|wetted|damp|dry|soaked|glazed|layered|added)\b|\b(?:original|actual|exact)\s+(?:brush|pigment|paper moisture|wash sequence|process)\b.{0,40}\b(?:is|was|were|used|must be)\b/i;
  return conciseText(
    cleanDisplayText(suggestedMethodText(value))
      .trim()
      .split(/(?<=[.!?])\s+|\r?\n+/)
      .filter((sentence) => !originalProcess.test(sentence))
      .join(" "),
    2,
  );
}

function studyInstruction(value: string): string {
  // The card explicitly frames execution as a new study, never a correction.
  const prefix = "In a separate study, ";
  return value
    .trim()
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map((sentence) => {
      // A preventative stop cue describes a limit for the new study, not a
      // diagnosis of the uploaded work. Other harsh wording stays guarded.
      const check = /^stop before\b/i.test(sentence)
        ? sentence.replace(/\boverwork\w*\b/gi, "repeated handling")
        : sentence;
      return studyText(prefix + check, "") ? sentence : "";
    })
    .filter(Boolean)
    .join(" ");
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

export function isConciseBrushPlan(value: unknown): boolean {
  const steps = usableBrushPlan(value);
  return (
    steps.length === 1 &&
    Object.values(steps[0]).reduce((length, text) => length + text.length, 0) <=
      300
  );
}

/** Free text is not a second technique enum. Omit rather than guess a method. */
export function displayWash(wash: string): string {
  if (/\b[a-z0-9]+(?:_[a-z0-9]+)+\b/i.test(wash)) return "";
  // Any named application method duplicates or contradicts the Technique row.
  if (/\b(?:wet|damp)[ -]on[ -](?:wet|dry|damp)\b/i.test(wash)) return "";
  return suggestedMethod(wash);
}

function stageLabel(value: string): string {
  return value
    .replace(
      /^(?:for a separate study[:;,]?\s*)?(?:a )?suggested practice method(?:,?\s*not a reconstruction(?: of the original process)?)?(?:[:;,.]\s*|$)/i,
      "",
    )
    .replace(/^(?:for|in|on) (?:a )?separate (?:small )?study[:;,]\s*/i, "")
    .trim();
}

function PlanNote({ label, text }: { label: string; text: string }) {
  return (
    <View style={planStyles.note}>
      <Text style={planStyles.label}>{label}</Text>
      <Text style={planStyles.instruction}>{text}</Text>
    </View>
  );
}

export default function BrushWashPlanCard({
  plan,
  study = false,
  hideHeading = false,
  omit = [],
}: {
  plan: unknown;
  study?: boolean;
  hideHeading?: boolean;
  omit?: string[];
}) {
  const seenSteps: string[] = [];
  const steps = usableBrushPlan(plan).filter((step) => {
    const notes = [step.brush, step.wash, step.timing, step.edges, step.stop]
      .map(suggestedMethod)
      .map((text) => (study ? studyInstruction(text) : text));
    if (!notes.some(Boolean)) return false;
    const signature = [step.technique, ...notes].join(" ");
    if (!uniqueGuidance([signature], seenSteps).length) return false;
    seenSteps.push(signature);
    return true;
  });
  if (!steps.length) return null;
  return (
    <View style={hideHeading ? { gap: 16 } : styles.card}>
      {!hideHeading && (
        <Text style={styles.heading}>
          {study ? "How to practise this handling" : "Brush & wash plan"}
        </Text>
      )}
      <Text style={styles.caption}>
        {study
          ? "For a separate study: a suggested practice method, not a reconstruction of the original process."
          : "A suggested practice method, not a reconstruction of the original process."}
      </Text>
      {steps.map((step, index) => {
        const stageText = suggestedMethod(step.stage);
        const stage =
          stageLabel(
            study ? studyText(stageText, "Handling study") : stageText,
          ) || "Handling study";
        const seen = [stage, ...omit];
        const notes = [
          ["Brush", step.brush],
          ["Wash", step.wash],
          ["Timing", step.timing],
          ["Edges", step.edges],
          ["Stop", step.stop],
        ].flatMap(([label, supplied]) => {
          const method =
            label === "Wash"
              ? displayWash(supplied)
              : suggestedMethod(supplied);
          const text = study ? studyInstruction(method) : method;
          if (!uniqueGuidance([text], seen).length) return [];
          seen.push(text);
          return [{ label, text }];
        });
        const stop = notes.find((note) => note.label === "Stop");
        return (
          <View
            key={`${step.stage}-${index}`}
            style={[planStyles.stage, index > 0 && planStyles.divider]}
          >
            <View style={planStyles.stageHeading}>
              <View style={planStyles.number}>
                <Text style={planStyles.numberText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={planStyles.stageName}>{stage}</Text>
                <Text style={planStyles.technique}>
                  {techniqueLabels[step.technique]}
                </Text>
              </View>
            </View>
            <View style={{ gap: 8 }}>
              {notes
                .filter((note) => note.label !== "Stop")
                .map((note) => (
                  <PlanNote
                    key={note.label}
                    label={note.label}
                    text={note.text}
                  />
                ))}
            </View>
            {!!stop && (
              <View style={planStyles.stop}>
                <Text style={planStyles.stopLabel}>Stop</Text>
                <Text style={planStyles.instruction}>{stop.text}</Text>
              </View>
            )}
          </View>
        );
      })}
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
