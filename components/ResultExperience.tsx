import { useEffect, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import type {
  ImproveData,
  ReferenceData,
  ResultProvider,
} from "../lib/artworks";
import {
  coherentFeedback,
  usableCoachingDecision,
  structuralAction,
} from "../lib/coachingDecision";
import {
  conciseText,
  compositionGuidance,
  currentActionSafe,
  requiresNewStudy,
  studyText,
  uniqueGuidance,
} from "../lib/coachingPresentation";
import {
  exploreOrder,
  primaryExploreSection,
  resultFocus,
  type ExploreKey,
} from "../lib/resultFocus";
import { planPlanningStudies } from "../lib/planningStudies";
import ResultLayout from "./ResultLayout";
import ResultProviderLabel from "./ResultProviderLabel";
import { SavedImage } from "./SavedResultState";
import { curatedCoachingNotes, VisualCoachingNotes } from "./CoachingOverlay";
import FeedbackDetails from "./FeedbackDetails";
import FeedbackSection from "./FeedbackSection";
import StudyDisclosure from "./StudyDisclosure";
import PlanningStudies, { SketchValueNotes } from "./PlanningStudies";
import PaletteCard, { usablePalette } from "./PaletteCard";
import BrushWashPlanCard, { usableBrushPlan } from "./BrushWashPlanCard";
import PaintingStepsCard from "./PaintingStepsCard";
import ReferencePreparation from "./ReferencePreparation";
import FollowUpQuestion from "./FollowUpQuestion";
import { styles } from "./ui";

type Props = {
  provider: ResultProvider;
  isSaved: boolean;
  focus?: string | null;
  image?: string;
  warning?: string;
} & (
  | { mode: "improve_painting"; result: ImproveData }
  | { mode: "create_reference"; result: ReferenceData }
);
type Row = {
  key: ExploreKey;
  title: string;
  helper?: string;
  content: ReactNode;
};

const nextStudyOnly = (text: string) =>
  requiresNewStudy(text) || structuralAction(text);

function DetailNote({
  title,
  text,
  study,
  omit = [],
}: {
  title: string;
  text: unknown;
  study: boolean;
  omit?: string[];
}) {
  const note = conciseText(study ? studyText(text, "") : text, 2);
  if (!uniqueGuidance([note], omit).length) return null;
  const structural = nextStudyOnly(note);
  return (
    <FeedbackSection
      title={
        structural
          ? study
            ? "Optional next-study variation"
            : "Next study"
          : title
      }
      text={note}
    />
  );
}

export default function ResultExperience(props: Props) {
  const [chosenSection, setChosenSection] = useState<ExploreKey | null>();
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  useEffect(() => {
    setChosenSection(undefined);
    setSelectedNote(null);
  }, [props.result, props.focus]);
  const { provider, isSaved, image, warning, mode } = props;
  const live = provider === "openai";
  // Projection only: reading or exploring a result never rewrites saved data.
  const result = live ? coherentFeedback(props.result, mode) : props.result;
  const decision = live
    ? usableCoachingDecision(result.coachingDecision)
    : null;
  const study = live && result.coachingMode === "study";
  const focus = resultFocus(props.focus);
  const painting = result as ImproveData;
  const reference = result as ReferenceData;
  const advice =
    mode === "improve_painting" ? painting.mainAdvice : result.composition;
  const guardedAdvice = study
    ? studyText(decision?.primaryGoal ?? advice)
    : (decision?.primaryGoal ?? advice);
  const summary = conciseText(guardedAdvice);
  const priority = nextStudyOnly(summary)
    ? `${study ? "Optional next-study variation" : "Next study"}: ${summary}`
    : summary;
  const practiceSource =
    mode === "improve_painting" ? painting.practice : reference.practice;
  // Legacy reference plans have no practice field; use their supplied first
  // step on a separate sheet rather than inventing an image observation.
  const practice = study
    ? studyText(
        practiceSource,
        "Spend 15 minutes testing one observed decision in a separate small study.",
      )
    : typeof practiceSource === "string" && practiceSource.trim()
      ? practiceSource
      : `In a separate 15-minute study: ${reference.steps?.[0] ?? "test one decision from the painting plan."}`;
  const shortPractice =
    uniqueGuidance([conciseText(practice, 2)], [summary])[0] ??
    "Spend 15 minutes testing this coaching decision on a separate sheet. Compare its effect with your starting plan.";
  const notes = live && image ? curatedCoachingNotes(result.overlays) : [];
  const brush = usableBrushPlan(result.brushPlan);
  const omit = [summary, shortPractice];
  const planningInput = {
    provider,
    uri: live ? image : undefined,
    overlays: notes,
    title: live ? result.title : undefined,
    composition: result.composition,
    sketch: result.sketch,
    values: result.values,
    study,
    focus,
    coachingDecision: decision,
  };
  const studies = planPlanningStudies(planningInput);
  const composition = compositionGuidance({
    decision: decision
      ? {
          mainIssue: null,
          reason: decision.compositionImplication,
          tryNow: decision.currentPaintingAction,
          nextStudy: decision.nextStudyAction,
        }
      : result.compositionDecision,
    overlays: notes,
    mainAdvice: guardedAdvice,
    composition: result.composition,
    study,
  });
  const compositionNote = decision
    ? decision.compositionImplication
    : result.composition;
  const colourNote = decision
    ? decision.colourImplication
    : (result.paletteStrategy ?? result.values);
  const techniqueNote = decision?.techniqueImplication;
  const currentSource = decision
    ? decision.currentPaintingAction
    : composition.tryNow;
  const nextSource = decision
    ? decision.nextStudyAction
    : composition.nextStudy;
  const current =
    !study && currentActionSafe(currentSource) ? currentSource : "";
  const next = study ? studyText(nextSource, "") : nextSource;
  const actions = (
    <>
      {!!current && (
        <DetailNote
          title="Current painting"
          text={current}
          study={false}
          omit={omit}
        />
      )}
      {!!next && (
        <DetailNote
          title={study ? "Optional next-study variation" : "Next study"}
          text={next}
          study={study}
          omit={[...omit, compositionNote ?? ""]}
        />
      )}
    </>
  );
  const followUp =
    mode === "improve_painting" && live
      ? conciseText(study ? studyText(painting.prompt, "") : painting.prompt)
      : "";
  const rows: Row[] = [
    ...(notes.length
      ? [
          {
            key: "visual" as const,
            title: "Visual coaching notes",
            helper: `${notes.length} notes`,
            content: (
              <VisualCoachingNotes
                notes={notes}
                study={study}
                selected={selectedNote}
                onSelect={setSelectedNote}
              />
            ),
          },
        ]
      : []),
    {
      key: "planning",
      title: "Planning studies",
      helper: `${studies.length} ${study ? "optional study variations" : "studies"}`,
      content: <PlanningStudies {...planningInput} />,
    },
    {
      key: "composition",
      title: "Composition",
      helper: "Eye path, focal placement and large shapes.",
      content: (
        <View style={{ gap: 12 }}>
          <DetailNote
            title={study ? "Observe this decision" : "Composition decision"}
            text={compositionNote}
            study={study}
            omit={omit}
          />
          <DetailNote
            title={study ? "Study this effect" : "Why it matters"}
            text={
              decision ? decision.compositionImplication : composition.reason
            }
            study={study}
            omit={[...omit, compositionNote ?? ""]}
          />
          {(!decision ||
            focus === "Composition" ||
            mode === "create_reference") &&
            actions}
        </View>
      ),
    },
    {
      key: "colour",
      title: "Colour & value",
      helper: "Value hierarchy, temperature and suggested palette.",
      content: (
        <View style={{ gap: 12 }}>
          <DetailNote
            title="Colour & value strategy"
            text={colourNote}
            study={study}
            omit={omit}
          />
          <PaletteCard
            palette={result.palette}
            strategy={result.paletteStrategy}
            study={study}
            omit={[...omit, typeof colourNote === "string" ? colourNote : ""]}
          />
          {decision &&
            focus === "Colour & contrast" &&
            mode === "improve_painting" &&
            actions}
        </View>
      ),
    },
    ...(brush.length || techniqueNote
      ? [
          {
            key: "technique" as const,
            title: "Watercolor technique",
            helper: study
              ? "How to practise this handling."
              : "Brush & wash plan · suggested practice method.",
            content: (
              <View style={{ gap: 12 }}>
                <DetailNote
                  title="Handling to practise"
                  text={techniqueNote}
                  study={study}
                  omit={omit}
                />
                <BrushWashPlanCard
                  plan={result.brushPlan}
                  study={study}
                  omit={[...omit, guardedAdvice]}
                />
                {decision &&
                  focus === "Watercolor technique" &&
                  mode === "improve_painting" &&
                  actions}
              </View>
            ),
          },
        ]
      : []),
    {
      key: "sketch",
      title: "Sketch & value plan",
      helper: "Full study notes when you need them.",
      content: (
        <View style={{ gap: 12 }}>
          <SketchValueNotes
            sketch={result.sketch}
            values={result.values}
            study={study}
          />
          {guardedAdvice !== summary && (
            <FeedbackSection
              title="Full coaching note"
              text={
                nextStudyOnly(guardedAdvice)
                  ? `Next study: ${guardedAdvice}`
                  : guardedAdvice
              }
            />
          )}
          {practice !== conciseText(practice, 2) && (
            <FeedbackSection title="Full practice note" text={practice} />
          )}
          {decision &&
            focus === "Overall feedback" &&
            mode === "improve_painting" &&
            actions}
        </View>
      ),
    },
    ...(followUp
      ? [
          {
            key: "followup" as const,
            title: "Ask a follow-up",
            helper: "Ask another coaching question about this painting.",
            content: (
              <FollowUpQuestion text={followUp} study={study} hideHeading />
            ),
          },
        ]
      : []),
  ];
  let order = exploreOrder(focus);
  if (mode === "create_reference") {
    if (live && image)
      rows.push({
        key: "preparation",
        title: "Reference preparation",
        helper: "Optional views of your original photo.",
        content: <ReferencePreparation uri={image} />,
      });
    const steps = study
      ? uniqueGuidance(
          reference.steps.map((step) =>
            studyText(`In a separate study, ${step}`, "").replace(
              /^In a separate study, /,
              "",
            ),
          ),
        ).filter(Boolean)
      : reference.steps;
    if (steps.length)
      rows.push({
        key: "steps",
        title: "Painting sequence",
        helper: "Your supplied step-by-step painting plan.",
        content: <PaintingStepsCard steps={steps} />,
      });
    order = [
      "preparation",
      "planning",
      "composition",
      "colour",
      "technique",
      "steps",
      "sketch",
      "visual",
    ];
  }
  const promoted =
    mode === "improve_painting" ? primaryExploreSection(focus) : null;
  const visibleRows = rows.filter((row) => {
    if (!decision) return true;
    if (row.key === "composition")
      return (
        !!compositionNote ||
        ((focus === "Composition" || mode === "create_reference") &&
          !!(current || next))
      );
    if (row.key === "colour")
      return !!colourNote || usablePalette(result.palette).length > 0;
    return true;
  });
  const openSection =
    chosenSection === undefined
      ? (visibleRows.find((row) => row.key === promoted)?.key ?? null)
      : chosenSection;
  return (
    <ResultLayout
      header={
        <>
          <Text style={styles.title}>
            {live ? result.title : "Sample watercolor guide"}
          </Text>
          <ResultProviderLabel provider={provider} isSaved={isSaved} />
          {study && (
            <Text style={styles.caption}>
              Study observations and optional variations, rather than
              corrections.
            </Text>
          )}
          {!!warning && (
            <Text accessibilityRole="alert" style={styles.body}>
              {warning}
            </Text>
          )}
          {mode === "improve_painting" && (
            <Text style={styles.caption}>Your selected focus: {focus}</Text>
          )}
        </>
      }
      image={
        live ? (
          <SavedImage
            uri={image}
            label={mode === "create_reference" ? "Your photo" : "Your painting"}
            overlays={notes}
            study={study}
            hideNotes
            selectedNote={selectedNote}
            onSelectNote={(index) => {
              setSelectedNote(index);
              setChosenSection("visual");
            }}
            onOpenNotes={() => setChosenSection("visual")}
          />
        ) : null
      }
      guidance={
        <>
          <FeedbackSection
            title={
              mode === "create_reference"
                ? "Painting plan"
                : study
                  ? "Study observation"
                  : "Main coaching point"
            }
            text={priority}
            highlight
          />
          {mode === "create_reference" && (
            <Text style={styles.caption}>
              A plan for your painting. No new image is generated.
            </Text>
          )}
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
      explore={
        <View style={{ gap: 12 }} testID="explore-feedback">
          <Text style={styles.heading}>Explore your feedback</Text>
          {order.flatMap((key) => {
            const row = visibleRows.find((item) => item.key === key);
            return row
              ? [
                  <StudyDisclosure
                    key={key}
                    title={row.title}
                    helper={row.helper}
                    open={openSection === key}
                    onOpenChange={(open) => setChosenSection(open ? key : null)}
                  >
                    {row.content}
                  </StudyDisclosure>,
                ]
              : [];
          })}
        </View>
      }
    />
  );
}
