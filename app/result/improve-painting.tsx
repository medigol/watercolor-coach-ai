import { Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import FeedbackSection from "../../components/FeedbackSection";
import CompositionSuggestionCard from "../../components/CompositionSuggestionCard";
import SketchGuideCard from "../../components/SketchGuideCard";
import ValueStudyCard from "../../components/ValueStudyCard";
import { Screen, styles } from "../../components/ui";
import { improveResult as result } from "../../data/mockResults";
export default function ImproveResult() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  return (
    <Screen>
      <Text style={styles.title}>{result.title}</Text>
      <Text style={styles.caption}>
        Sample feedback{focus ? ` · Your selected focus: ${focus}` : ""}
      </Text>
      <FeedbackSection title="Main advice" text={result.mainAdvice} highlight />
      <FeedbackSection title="What works" items={result.whatWorks} />
      <FeedbackSection title="What to fix" items={result.whatToFix} />
      <CompositionSuggestionCard text={result.composition} />
      <SketchGuideCard description={result.sketch} />
      <ValueStudyCard description={result.values} />
      <FeedbackSection title="Next 15-minute practice" text={result.practice} />
      <FeedbackSection title="Suggested next prompt" text={result.prompt} />
    </Screen>
  );
}
