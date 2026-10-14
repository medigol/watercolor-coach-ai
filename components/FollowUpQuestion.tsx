import { Text, View } from "react-native";
import { styles } from "./ui";
import { conciseText, studyText } from "../lib/coachingPresentation";

export default function FollowUpQuestion({
  text,
  study = false,
  hideHeading = false,
}: {
  text: string;
  study?: boolean;
  hideHeading?: boolean;
}) {
  if (typeof text !== "string" || !text.trim()) return null;
  const question = study ? studyText(conciseText(text), "") : conciseText(text);
  if (!question) return null;
  return (
    <View
      style={{
        gap: 8,
        paddingHorizontal: hideHeading ? 0 : 8,
        paddingVertical: hideHeading ? 4 : 12,
      }}
    >
      {!hideHeading && (
        <Text style={[styles.heading, { fontSize: 16 }]}>Ask a follow-up</Text>
      )}
      {!hideHeading && (
        <Text style={styles.caption}>
          Ask another coaching question about this painting.
        </Text>
      )}
      {study && (
        <Text style={styles.caption}>
          Optional learning question for a future study.
        </Text>
      )}
      <Text style={styles.body}>{question}</Text>
    </View>
  );
}
