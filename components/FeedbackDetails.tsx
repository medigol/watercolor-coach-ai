import { Text, View } from "react-native";
import FeedbackSection from "./FeedbackSection";
import { styles } from "./ui";
import {
  requiresNewStudy,
  studyText,
  uniqueGuidance,
} from "../lib/coachingPresentation";

function feedbackItems(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter(
          (item): item is string =>
            typeof item === "string" && !!item.trim() && item.length <= 500,
        )
        .slice(0, 8)
    : [];
}

export default function FeedbackDetails({
  works,
  fixes,
  promising,
  study = false,
  omit = [],
}: {
  works?: unknown;
  fixes?: unknown;
  promising?: unknown;
  study?: boolean;
  omit?: string[];
}) {
  const originalStrengths = feedbackItems(works)
    .map((item) => (study ? studyText(item, "") : item))
    .filter(Boolean);
  let strengths = uniqueGuidance(originalStrengths, omit).slice(0, 3);
  // A supplied positive observation stays visible even when the summary quotes it.
  if (!strengths.length && originalStrengths.length)
    strengths = uniqueGuidance(originalStrengths).slice(0, 1);
  const suppliedPotential =
    typeof promising === "string" &&
    promising.trim().length >= 24 &&
    promising.length <= 350 &&
    !/^(?:great|beautiful|excellent|lovely|nice|wonderful|good) (?:work|painting|job)[.! ]*$/i.test(
      promising.trim(),
    )
      ? promising
      : undefined;
  const potential = suppliedPotential
    ? uniqueGuidance(
        [study ? studyText(suppliedPotential, "") : suppliedPotential],
        [...omit, ...strengths],
      )[0]
    : undefined;
  const improvements = uniqueGuidance(
    feedbackItems(fixes)
      .map((item) => (study ? studyText(item, "") : item))
      .filter(Boolean),
    [...omit, ...strengths, ...(potential ? [potential] : [])],
  ).slice(0, 3);
  if (!strengths.length && !improvements.length && !potential) return null;
  return (
    <View style={{ gap: 12 }}>
      {!!(strengths.length || potential) && (
        <FeedbackSection
          title={study ? "What makes this work" : "What works well"}
          items={strengths}
        >
          {!!potential && (
            <View
              style={{
                gap: 4,
                borderTopWidth: 1,
                borderTopColor: "#E3E8E5",
                paddingTop: 10,
              }}
            >
              <Text style={[styles.caption, { fontWeight: "600" }]}>
                {study
                  ? "Advanced observations"
                  : "Why this is worth developing"}
              </Text>
              <Text style={[styles.body, { fontSize: 14, lineHeight: 21 }]}>
                {potential}
              </Text>
            </View>
          )}
        </FeedbackSection>
      )}
      {!!improvements.length && (
        <FeedbackSection
          title={study ? "Optional refinements" : "What to improve"}
          items={
            study
              ? improvements.map((item) => `Optional next study: ${item}`)
              : improvements.map((item) =>
                  requiresNewStudy(item) &&
                  !/^(?:next study|(?:in|for) (?:a|the|your) (?:next|new|separate) study)\b/i.test(
                    item,
                  )
                    ? `Next study: ${item}`
                    : item,
                )
          }
        />
      )}
    </View>
  );
}
