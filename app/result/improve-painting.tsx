import { useSavedResult } from "../../hooks/useSavedResult";
import { ResultState, SavedImage } from "../../components/SavedResultState";
import { Text } from "react-native";
import FeedbackSection from "../../components/FeedbackSection";
import CompositionSuggestionCard from "../../components/CompositionSuggestionCard";
import SketchGuideCard from "../../components/SketchGuideCard";
import ValueStudyCard from "../../components/ValueStudyCard";
import { Screen, styles } from "../../components/ui";
import { improveResult as sample } from "../../data/mockResults";
export default function ImproveResult() {
  const { result, provider, focus, image, loading, error, warning, retry } =
    useSavedResult(sample, "improve_painting");
  if (loading || error)
    return <ResultState loading={loading} error={error} retry={retry} />;
  return (
    <Screen>
      <Text style={styles.title}>{result.title}</Text>
      {!!warning && (
        <Text accessibilityRole="alert" style={styles.body}>
          {warning}
        </Text>
      )}
      <SavedImage uri={image} />
      <Text style={styles.caption}>
        {provider === "mock" ? "Sample feedback" : "Painting feedback"}
        {focus ? ` · Your selected focus: ${focus}` : ""}
      </Text>
      <FeedbackSection title="Main advice" text={result.mainAdvice} highlight />
      <FeedbackSection title="What works" items={result.whatWorks} />
      <FeedbackSection title="What to fix" items={result.whatToFix} />
      <CompositionSuggestionCard text={result.composition} />
      <Text style={styles.caption}>
        The visual studies below are generic planning aids, not studies
        generated from your painting.
      </Text>
      <SketchGuideCard description={result.sketch} />
      <ValueStudyCard description={result.values} />
      <FeedbackSection title="Next 15-minute practice" text={result.practice} />
      <FeedbackSection title="Suggested next prompt" text={result.prompt} />
    </Screen>
  );
}
