import { Text } from "react-native";
import ReferencePreparation from "../../components/ReferencePreparation";
import CompositionSuggestionCard from "../../components/CompositionSuggestionCard";
import ThumbnailPlanning from "../../components/ThumbnailPlanning";
import PaletteCard from "../../components/PaletteCard";
import FeedbackDetails from "../../components/FeedbackDetails";
import BrushWashPlanCard, {
  isConciseBrushPlan,
  usableBrushPlan,
} from "../../components/BrushWashPlanCard";
import CompositionModels from "../../components/CompositionModels";
import StudyDisclosure from "../../components/StudyDisclosure";
import PaintingStepsCard from "../../components/PaintingStepsCard";
import ResultLayout from "../../components/ResultLayout";
import ResultProviderLabel from "../../components/ResultProviderLabel";
import { ResultState, SavedImage } from "../../components/SavedResultState";
import { styles } from "../../components/ui";
import { useSavedResult } from "../../hooks/useSavedResult";
import type { ReferenceData } from "../../lib/artworks";
import { referenceResult as sample } from "../../data/mockResults";
import {
  conciseText,
  studyText,
  uniqueGuidance,
} from "../../lib/coachingPresentation";
export default function ReferenceResult() {
  const { result, provider, isSaved, image, loading, error, warning, retry } =
    useSavedResult<ReferenceData>(sample, "create_reference");
  if (loading || error)
    return <ResultState loading={loading} error={error} retry={retry} />;
  const live = provider === "openai";
  const study = live && result.coachingMode === "study";
  const plan = study ? studyText(result.composition) : result.composition;
  const summary = conciseText(plan, 2);
  const brush = usableBrushPlan(result.brushPlan);
  const steps = study
    ? uniqueGuidance(result.steps.map((step) => studyText(step)))
    : result.steps;
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
              Study observations and optional variations. Use these notes to
              explore the reference in your own small study.
            </Text>
          )}
          {!!warning && (
            <Text accessibilityRole="alert" style={styles.body}>
              {warning}
            </Text>
          )}
        </>
      }
      image={
        live ? (
          <SavedImage
            overlays={result.overlays}
            uri={image}
            label="Your photo"
            study={study}
          />
        ) : null
      }
      guidance={
        <>
          <Text style={styles.caption}>PLAN · choose the big shapes</Text>
          <CompositionSuggestionCard title="Painting plan" text={summary} />
          <Text style={styles.caption}>
            Coaching notes for a painting you create. No new image is generated.
          </Text>
          <FeedbackDetails
            works={result.whatWorks}
            fixes={result.whatToFix}
            promising={result.promising}
            study={study}
            omit={[summary]}
          />
        </>
      }
      planning={
        <>
          {live && !!image && (
            <StudyDisclosure
              title="Reference preparation"
              helper="Optional views of your original reference."
            >
              <ReferencePreparation uri={image} />
            </StudyDisclosure>
          )}
          <StudyDisclosure
            title="Composition model"
            helper="Optional teaching ideas for your painting plan."
          >
            <CompositionModels
              overlays={live ? result.overlays : undefined}
              composition={result.composition}
              values={result.values}
              title={live ? result.title : undefined}
              study={study}
              hideHeading
            />
            {plan !== summary && (
              <CompositionSuggestionCard
                title="More on the painting plan"
                text={plan}
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
          </StudyDisclosure>
        </>
      }
      painting={
        <>
          <Text style={styles.caption}>
            PAINT · fewer colours, clear washes
          </Text>
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
                omit={[plan, summary]}
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
                  omit={[plan, summary]}
                  hideHeading
                />
              </StudyDisclosure>
            ))}
          <PaintingStepsCard steps={steps} />
        </>
      }
    />
  );
}
