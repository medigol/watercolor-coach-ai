import { Text, View } from "react-native";
import FeedbackSection from "./FeedbackSection";
import { styles } from "./ui";

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
}: {
  works?: unknown;
  fixes?: unknown;
  promising?: unknown;
}) {
  const strengths = feedbackItems(works);
  const improvements = feedbackItems(fixes);
  const potential =
    typeof promising === "string" && promising.trim() && promising.length <= 350
      ? promising
      : undefined;
  if (!strengths.length && !improvements.length && !potential) return null;
  return (
    <View style={{ gap: 12 }}>
      {!!(strengths.length || potential) && (
        <FeedbackSection title="What works well" items={strengths}>
          {!!potential && (
            <View style={{ gap: 6 }}>
              <Text style={[styles.heading, { fontSize: 16 }]}>
                What is promising
              </Text>
              <Text style={styles.body}>{potential}</Text>
            </View>
          )}
        </FeedbackSection>
      )}
      {!!improvements.length && (
        <FeedbackSection title="What to improve" items={improvements} />
      )}
    </View>
  );
}
