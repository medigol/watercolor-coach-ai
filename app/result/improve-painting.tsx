import { Text } from "react-native";
import FeedbackDetails from "../../components/FeedbackDetails";
import FeedbackSection from "../../components/FeedbackSection";
import CompositionSuggestionCard from "../../components/CompositionSuggestionCard";
import CompositionDecisionCard from "../../components/CompositionDecisionCard";
import ThumbnailPlanning from "../../components/ThumbnailPlanning";
import PaletteCard from "../../components/PaletteCard";
import BrushWashPlanCard, {
  isConciseBrushPlan,
  usableBrushPlan,
} from "../../components/BrushWashPlanCard";
import CompositionModels from "../../components/CompositionModels";
import StudyDisclosure from "../../components/StudyDisclosure";
import ResultLayout from "../../components/ResultLayout";
import ResultProviderLabel from "../../components/ResultProviderLabel";
import FollowUpQuestion from "../../components/FollowUpQuestion";
import { ResultState, SavedImage } from "../../components/SavedResultState";
import { styles } from "../../components/ui";
import { useSavedResult } from "../../hooks/useSavedResult";
import {
  conciseText,
  requiresNewStudy,
  studyText,
  uniqueGuidance,
} from "../../lib/coachingPresentation";
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
  const live = provider === "openai";
  const study = live && result.coachingMode === "study";
  const advice = study ? studyText(result.mainAdvice) : result.mainAdvice;
  const summary = conciseText(advice);
  const priority = requiresNewStudy(advice)
    ? `${study ? "Optional next study variation" : "For the next study"}: ${summary}`
    : summary;
  const practice = study
    ? studyText(
        result.practice,
        "For 15 minutes, test one value or edge decision in a separate small study, then compare its effect.",
      )
    : result.practice;
  const practiceSummary = conciseText(practice, 2);
  const shortPractice = !uniqueGuidance([practiceSummary], [summary]).length
    ? "Spend 15 minutes testing one coaching decision in a small thumbnail. Compare it with your starting plan."
    : practiceSummary;
  const brush = usableBrushPlan(result.brushPlan);
  const followUp = study
    ? studyText(result.prompt, "")
    : conciseText(result.prompt);
  return (
    <ResultLayout
      header={
        <>
          <Text style={styles.title}>
            {live ? result.title : "Sample watercolor guide"}
          </Text>
          <ResultProviderLabel provider={provider} isSaved={isSaved} />
          {study && (
            <Text style={styles.body}>
              Study observations and optional variations. Learn from the
              painting’s existing decisions in a separate study.
            </Text>
          )}
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
      image={
        live ? (
          <SavedImage overlays={result.overlays} uri={image} study={study} />
        ) : null
      }
      guidance={
        <>
          <Text style={styles.caption}>
            {study
              ? "STUDY · learn from the decisions"
              : "IMPROVE · one painting decision"}
          </Text>
          <FeedbackSection
            title={study ? "Study observation" : "Main priority"}
            text={priority}
            highlight
          />
          <FeedbackDetails
            works={result.whatWorks}
            fixes={result.whatToFix}
            promising={result.promising}
            study={study}
            omit={[summary]}
          />
          <FeedbackSection
            title="Next 15-minute practice"
            text={shortPractice}
          />
        </>
      }
      planning={
        <>
          <StudyDisclosure
            title="Composition model"
            helper="Optional teaching ideas for a separate study."
          >
            {compositionFocus ? (
              <CompositionDecisionCard
                decision={result.compositionDecision}
                overlays={live ? result.overlays : undefined}
                mainAdvice={advice}
                composition={result.composition}
                study={study}
              />
            ) : (
              <CompositionSuggestionCard
                title={
                  study
                    ? "Optional next study variation"
                    : "Try in the next study"
                }
                text={
                  study
                    ? studyText(result.composition)
                    : conciseText(result.composition)
                }
              />
            )}
            <CompositionModels
              overlays={live ? result.overlays : undefined}
              composition={result.composition}
              values={result.values}
              title={live ? result.title : undefined}
              study={study}
              hideHeading
            />
            {advice !== summary && (
              <FeedbackSection
                title={
                  study ? "More on this observation" : "More on this priority"
                }
                text={
                  study || !requiresNewStudy(advice)
                    ? advice
                    : `For the next study: ${advice}`
                }
              />
            )}
          </StudyDisclosure>
          <StudyDisclosure
            title={study ? "Optional planning variation" : "Thumbnail planning"}
            helper="Small visual studies to explore when useful."
          >
            <ThumbnailPlanning
              provider={provider}
              uri={live ? image : undefined}
              overlays={live ? result.overlays : undefined}
              title={live ? result.title : undefined}
              composition={result.composition}
              sketch={result.sketch}
              values={result.values}
              study={study}
              hideHeading
            />
            {practice !== practiceSummary && (
              <FeedbackSection title="More practice detail" text={practice} />
            )}
          </StudyDisclosure>
        </>
      }
      painting={
        <>
          <PaletteCard
            palette={result.palette}
            strategy={result.paletteStrategy}
            study={study}
          />
          {!!brush.length &&
            (isConciseBrushPlan(result.brushPlan) ? (
              <BrushWashPlanCard
                plan={result.brushPlan}
                study={study}
                omit={[advice, summary, practice, shortPractice]}
              />
            ) : (
              <StudyDisclosure
                title={
                  study ? "How to study this handling" : "Brush & wash plan"
                }
                helper="Brush, moisture, edges and stopping cues."
              >
                <BrushWashPlanCard
                  plan={result.brushPlan}
                  study={study}
                  omit={[advice, summary, practice, shortPractice]}
                  hideHeading
                />
              </StudyDisclosure>
            ))}
          {live && !!followUp && (
            <StudyDisclosure
              title="Follow-up question"
              helper="Use this if you want another coaching round."
              initiallyOpen={false}
            >
              <FollowUpQuestion text={followUp} study={study} hideHeading />
            </StudyDisclosure>
          )}
        </>
      }
    />
  );
}
