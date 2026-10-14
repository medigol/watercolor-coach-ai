import { Text } from "react-native";
import FeedbackDetails from "../../components/FeedbackDetails";
import FeedbackSection from "../../components/FeedbackSection";
import CompositionSuggestionCard from "../../components/CompositionSuggestionCard";
import CompositionDecisionCard from "../../components/CompositionDecisionCard";
import ThumbnailPlanning from "../../components/ThumbnailPlanning";
import PaletteCard from "../../components/PaletteCard";
import ResultLayout from "../../components/ResultLayout";
import ResultProviderLabel from "../../components/ResultProviderLabel";
import FollowUpQuestion from "../../components/FollowUpQuestion";
import { ResultState, SavedImage } from "../../components/SavedResultState";
import { styles } from "../../components/ui";
import { useSavedResult } from "../../hooks/useSavedResult";
import { requiresNewStudy } from "../../lib/coachingPresentation";
import type { ImproveData } from "../../lib/artworks";
import { improveResult as sample } from "../../data/mockResults";
export default function ImproveResult() {
  const {
    result,
    provider,
    isSaved,
    focus,
    image,
    loading,
    error,
    warning,
    retry,
  } = useSavedResult<ImproveData>(sample, "improve_painting");
  if (loading || error)
    return <ResultState loading={loading} error={error} retry={retry} />;
  const compositionFocus = focus === "Composition";
  return (
    <ResultLayout
      header={
        <>
          <Text style={styles.title}>{result.title}</Text>
          <ResultProviderLabel provider={provider} isSaved={isSaved} />
          {!!warning && (
            <Text accessibilityRole="alert" style={styles.body}>
              {warning}
            </Text>
          )}
          {!!focus && (
            <Text style={styles.caption}>Your selected focus: {focus}</Text>
          )}
        </>
      }
      image={<SavedImage overlays={result.overlays} uri={image} />}
      guidance={
        <>
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
        </>
      }
      planning={
        <ThumbnailPlanning
          uri={image}
          overlays={result.overlays}
          title={result.title}
          composition={result.composition}
          sketch={result.sketch}
          values={result.values}
        />
      }
      painting={
        <>
          <PaletteCard
            palette={result.palette}
            strategy={result.paletteStrategy}
          />
          <Text style={styles.caption}>PRACTISE · one useful next step</Text>
          <FeedbackSection
            title="Next 15-minute practice"
            text={result.practice}
          />
          <FollowUpQuestion text={result.prompt} />
        </>
      }
    />
  );
}
