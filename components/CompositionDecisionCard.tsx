import { Text, View } from "react-native";
import { compositionGuidance } from "../lib/coachingPresentation";
import { colors, styles } from "./ui";

export default function CompositionDecisionCard(
  props: Parameters<typeof compositionGuidance>[0],
) {
  const guidance = compositionGuidance(props);
  const sections = props.study
    ? [
        ["Observe this decision", guidance.mainIssue],
        ["Study this effect", guidance.reason],
        ["Optional next study variation", guidance.nextStudy],
      ]
    : [
        ["Main issue", guidance.mainIssue],
        ["Why it matters", guidance.reason],
        ["Try now on this painting", guidance.tryNow],
        ["Try in the next study", guidance.nextStudy],
      ];
  return (
    <View style={[styles.card, { backgroundColor: colors.blue, gap: 18 }]}>
      <Text style={styles.heading}>Composition decision</Text>
      {sections.map(([label, text]) => (
        <View key={label} style={{ gap: 5 }}>
          <Text
            style={[
              styles.caption,
              { fontWeight: "600", color: colors.accent },
            ]}
          >
            {label}
          </Text>
          <Text style={styles.body}>{text}</Text>
        </View>
      ))}
    </View>
  );
}
