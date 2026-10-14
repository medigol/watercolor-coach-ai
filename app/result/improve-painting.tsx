import FeedbackDetails from "../../components/FeedbackDetails";
import type { ImproveData } from "../../lib/artworks";
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
    useSavedResult<ImproveData>(sample, "improve_painting");
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
      <SavedImage overlays={result.overlays} uri={image} />
      <Text style={styles.caption}>
        {provider === "mock" ? "Sample feedback" : "Painting feedback"}
        {focus ? ` · Your selected focus: ${focus}` : ""}
      </Text>
      <Text style={styles.caption}>IMPROVE · one painting decision</Text>
      <FeedbackSection title="Main advice" text={result.mainAdvice} highlight />
      <FeedbackDetails works={result.whatWorks} fixes={result.whatToFix} />
      <CompositionSuggestionCard text={result.composition} />
      <Text style={styles.caption}>PLAN · think in big shapes</Text>
      <SketchGuideCard description={result.sketch} />
      <ValueStudyCard description={result.values} />
      <Text style={styles.caption}>PRACTISE · one useful next step</Text>
      <FeedbackSection title="Next 15-minute practice" text={result.practice} />
      <FeedbackSection title="Suggested next prompt" text={result.prompt} />
    </Screen>
  );
}
