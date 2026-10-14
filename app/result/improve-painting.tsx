import FeedbackDetails from "../../components/FeedbackDetails";
import type { ImproveData } from "../../lib/artworks";
import { useSavedResult } from "../../hooks/useSavedResult";
import { ResultState, SavedImage } from "../../components/SavedResultState";
import { Text } from "react-native";
import FeedbackSection from "../../components/FeedbackSection";
import CompositionSuggestionCard from "../../components/CompositionSuggestionCard";
import CompositionDecisionCard from "../../components/CompositionDecisionCard";
import ThumbnailPlanning from "../../components/ThumbnailPlanning";
import PaletteCard from "../../components/PaletteCard";
import { requiresNewStudy } from "../../lib/coachingPresentation";
import { Screen, styles } from "../../components/ui";
import { improveResult as sample } from "../../data/mockResults";
export default function ImproveResult() {
  const { result, provider, focus, image, loading, error, warning, retry } =
    useSavedResult<ImproveData>(sample, "improve_painting");
  if (loading || error)
    return <ResultState loading={loading} error={error} retry={retry} />;
  const compositionFocus = focus === "Composition";
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
      {compositionFocus && (
        <CompositionDecisionCard
          decision={result.compositionDecision}
          overlays={result.overlays}
          mainAdvice={result.mainAdvice}
          composition={result.composition}
        />
      )}
      <FeedbackSection
        title="Main advice"
        text={
          requiresNewStudy(result.mainAdvice)
            ? `For the next study: ${result.mainAdvice}`
            : result.mainAdvice
        }
        highlight
      />
      <FeedbackDetails works={result.whatWorks} fixes={result.whatToFix} />
      {!compositionFocus && (
        <CompositionSuggestionCard
          title="Try in the next study"
          text={result.composition}
        />
      )}
      <ThumbnailPlanning
        overlays={result.overlays}
        title={result.title}
        composition={result.composition}
        sketch={result.sketch}
        values={result.values}
      />
      <PaletteCard palette={result.palette} strategy={result.paletteStrategy} />
      <Text style={styles.caption}>PRACTISE · one useful next step</Text>
      <FeedbackSection title="Next 15-minute practice" text={result.practice} />
      <FeedbackSection title="Suggested next prompt" text={result.prompt} />
    </Screen>
  );
}
