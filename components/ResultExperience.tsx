import { sameLearningInsight } from "../shared/coachingEvidence";
import { overlayCategory } from "../lib/overlays";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform, Pressable, Text, View } from "react-native";
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
import { focusedMainAdvice, guidanceDomain } from "../lib/focusGuidance";
import {
  drawableCompositionOverlay,
  compositionIdentity,
  domainLabel,
} from "../shared/visualMetadata";
import { archetypeLabel } from "../lib/compositionArchetypes";
import { planVisualRoles } from "../lib/visualRoles";
import type { ImageSize } from "../shared/imageGeometry";
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
import { colors, styles } from "./ui";

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

function VisualChoice({
  title,
  label = title,
  active,
  onPress,
}: {
  title: string;
  label?: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      aria-pressed={!!active}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 12,
        justifyContent: "center",
        borderRadius: 10,
        backgroundColor: active ? colors.pale : colors.paper,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.border,
      }}
    >
      <Text
        style={[styles.caption, { color: colors.accent, fontWeight: "600" }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

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
  if (
    !uniqueGuidance([note], omit).length ||
    omit.some((previous) => sameLearningInsight(note, previous))
  )
    return null;
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
  const [sourceMetrics, setSourceMetrics] = useState<{
    uri: string;
    size: ImageSize;
  } | null>(null);
  const [coachingVisible, setCoachingVisible] = useState(true);
  const [chosenMode, setChosenMode] = useState<
    "notes" | "composition" | "roles"
  >();
  const [compositionVariant, setCompositionVariant] = useState<
    "primary" | "secondary"
  >("primary");
  const [pendingScroll, setPendingScroll] = useState<"image" | "notes" | null>(
    null,
  );
  const imageRef = useRef<View>(null);
  const noteRef = useRef<View>(null);
  useEffect(() => {
    setChosenSection(undefined);
    setSelectedNote(null);
    setCoachingVisible(true);
    setChosenMode(undefined);
    setCompositionVariant("primary");
    setPendingScroll(null);
  }, [props.result, props.focus]);
  useEffect(() => {
    if (!pendingScroll) return;
    if (Platform.OS === "web") {
      const ref = pendingScroll === "image" ? imageRef : noteRef;
      const node = ref.current as unknown as {
        scrollIntoView?: (options: ScrollIntoViewOptions) => void;
      } | null;
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      node?.scrollIntoView?.({
        behavior: reduced ? "auto" : "smooth",
        block: "nearest",
      });
    }
    setPendingScroll(null);
  }, [pendingScroll, chosenSection]);
  const { provider, isSaved, image, warning, mode } = props;
  const onImageSize = useCallback(
    (size: ImageSize | null) => {
      setSourceMetrics(size && image ? { uri: image, size } : null);
    },
    [image],
  );
  const sourceSize =
    sourceMetrics && sourceMetrics.uri === image ? sourceMetrics.size : null;
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
    mode === "improve_painting"
      ? painting.mainAdvice ||
        result.whatWorks?.[0] ||
        "The original painting method cannot be confirmed from this image. Read the visible study notes below."
      : result.composition || "Read the saved painting-plan notes below.";
  const fullAdvice = study ? studyText(advice) : advice;
  const focused: ReturnType<typeof focusedMainAdvice> =
    mode === "improve_painting"
      ? focusedMainAdvice(fullAdvice, decision, focus)
      : { text: fullAdvice };
  const guardedAdvice = study ? studyText(focused.text) : focused.text;
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
  const primaryStructure = live
    ? drawableCompositionOverlay(result.compositionOverlay)
    : null;
  const candidateSecondary =
    live && primaryStructure
      ? drawableCompositionOverlay(result.secondaryCompositionOverlay)
      : null;
  const secondaryStructure =
    candidateSecondary &&
    primaryStructure &&
    compositionIdentity(candidateSecondary) !==
      compositionIdentity(primaryStructure)
      ? candidateSecondary
      : null;
  const activeStructure =
    compositionVariant === "secondary" && secondaryStructure
      ? secondaryStructure
      : primaryStructure;
  const roleRegions = planVisualRoles(
    notes,
    live ? result.compositionOverlay : undefined,
  );
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
    mainAdvice: guardedAdvice,
    practice: shortPractice,
    currentCompositionOverlay: primaryStructure,
    secondaryCompositionOverlay: secondaryStructure,
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
  // Legacy implications occasionally contain a physical recipe under a design
  // heading. Present that paragraph once, in its actual domain; keep the
  // supplied wording rather than inventing another image observation.
  const suppliedImplications = [
    {
      text: compositionNote,
      domain: guidanceDomain(compositionNote, "composition"),
    },
    { text: colourNote, domain: guidanceDomain(colourNote, "colour_value") },
    { text: techniqueNote, domain: guidanceDomain(techniqueNote, "technique") },
  ];
  const implications = suppliedImplications.filter(
    (item, index, all) =>
      typeof item.text === "string" &&
      uniqueGuidance(
        [item.text],
        all.slice(0, index).map((previous) => previous.text ?? ""),
      ).length > 0,
  );
  const compositionOmit = [
    ...omit,
    ...(activeStructure
      ? [
          activeStructure.shortExplanation,
          ...Object.values(activeStructure.teaching ?? {})
            .flat()
            .filter((item): item is string => typeof item === "string"),
        ]
      : []),
  ];
  const domainNotes = (
    domain: "composition" | "colour_value" | "technique",
    title: string,
    previous: string[] = omit,
  ) =>
    uniqueGuidance(
      implications
        .filter((item) => item.domain === domain)
        .map((item) => (typeof item.text === "string" ? item.text : "")),
      previous,
    )
      .filter(
        (text) => !previous.some((item) => sameLearningInsight(text, item)),
      )
      .map((text) => {
        const related = [
          ...new Set(
            suppliedImplications
              .filter(
                (item) =>
                  item.domain !== domain &&
                  typeof item.text === "string" &&
                  !uniqueGuidance([item.text], [text]).length,
              )
              .map((item) => item.domain),
          ),
        ];
        return (
          <View key={text} style={{ gap: 6 }}>
            <DetailNote
              title={title}
              text={text}
              study={study}
              omit={previous}
            />
            {related.length > 0 && (
              <Text style={styles.caption}>
                Also affects: {related.map(domainLabel).join(", ")}
              </Text>
            )}
          </View>
        );
      });
  // Legacy actions need a supplied source too; never add a generic repair or
  // repeat the composition paragraph as a fabricated future exercise.
  const legacyNow =
    typeof result.compositionDecision?.tryNow === "string"
      ? result.compositionDecision.tryNow
      : "";
  const legacyNext =
    typeof result.compositionDecision?.nextStudy === "string"
      ? result.compositionDecision.nextStudy
      : "";
  const designNotes = notes.filter((note) =>
    [
      "composition",
      "focal_point",
      "simplification",
      "value_structure",
    ].includes(overlayCategory(note)),
  );
  const suppliedNow =
    legacyNow ||
    designNotes.find(
      (note) => note.timing === "current_painting" || note.timing === "both",
    )?.action ||
    "";
  const currentSource = decision ? decision.currentPaintingAction : suppliedNow;
  const nextSource = decision
    ? decision.nextStudyAction
    : legacyNext ||
      (requiresNewStudy(suppliedNow) || structuralAction(suppliedNow)
        ? suppliedNow
        : "") ||
      designNotes.find((note) => note.timing === "next_study")?.action ||
      "";
  const current =
    !study && currentActionSafe(currentSource) ? currentSource : "";
  const next = study ? studyText(nextSource, "") : nextSource;
  const actionDomain =
    mode === "create_reference" || !decision || focus === "Composition"
      ? "composition"
      : focus === "Colour & contrast"
        ? "colour_value"
        : focus === "Watercolor technique"
          ? "technique"
          : "overall";
  const hasActions = (domain: "composition" | "colour_value" | "technique") =>
    (!!current && guidanceDomain(current, actionDomain) === domain) ||
    (!!next && guidanceDomain(next, actionDomain) === domain);
  const hasImplication = (
    domain: "composition" | "colour_value" | "technique",
  ) => implications.some((item) => item.domain === domain && item.text);
  const actions = (
    domain: "composition" | "colour_value" | "technique" | "overall",
  ) => (
    <>
      {!!current && guidanceDomain(current, actionDomain) === domain && (
        <DetailNote
          title="Current painting"
          text={current}
          study={false}
          omit={omit}
        />
      )}
      {!!next && guidanceDomain(next, actionDomain) === domain && (
        <DetailNote
          title={study ? "Optional next-study variation" : "Next study"}
          text={next}
          study={study}
          omit={[...compositionOmit, compositionNote ?? ""]}
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
              <View ref={noteRef}>
                <VisualCoachingNotes
                  notes={notes}
                  study={study}
                  selected={selectedNote}
                  uri={live ? image : undefined}
                  sourceSize={sourceSize}
                  onSelect={(index) => {
                    setSelectedNote(index);
                    setChosenMode("notes");
                    setCoachingVisible(true);
                    if (index !== null) setPendingScroll("image");
                  }}
                />
              </View>
            ),
          },
        ]
      : []),
    {
      key: "planning",
      title: "Planning studies",
      helper: `${studies.length} ${study ? "optional future variations" : "future study ideas"}`,
      content: <PlanningStudies {...planningInput} />,
    },
    {
      key: "composition",
      title: "Composition",
      helper: "Eye path, focal placement and large shapes.",
      content: (
        <View style={{ gap: 12 }}>
          {activeStructure && (
            <View style={{ gap: 10 }}>
              <Text style={[styles.caption, { fontWeight: "600" }]}>
                On your painting · {archetypeLabel(activeStructure.type)}
              </Text>
              <Text style={styles.body}>
                {conciseText(activeStructure.shortExplanation, 2)}
              </Text>
              {activeStructure.teaching && (
                <View style={{ gap: 6 }}>
                  <Text style={styles.caption}>
                    Visible elements:{" "}
                    {activeStructure.teaching.elements.join(", ")}
                  </Text>
                  {[
                    ["Entry", activeStructure.teaching.entry],
                    ["Path", activeStructure.teaching.path],
                    ["Landing", activeStructure.teaching.landing],
                    ["Supporting", activeStructure.teaching.supportingMass],
                    ["Quiet", activeStructure.teaching.quietMass],
                    ["Counterbalance", activeStructure.teaching.counterbalance],
                    ["Watch", activeStructure.teaching.risk],
                  ]
                    .filter(([, text]) => !!text)
                    .map(([label, text]) => (
                      <Text key={label} style={styles.body}>
                        {label}: {text}
                      </Text>
                    ))}
                </View>
              )}
              {secondaryStructure && (
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {(["primary", "secondary"] as const).map((variant) => (
                    <VisualChoice
                      key={variant}
                      title={
                        variant === "primary"
                          ? "Primary structure"
                          : "Secondary structure"
                      }
                      active={compositionVariant === variant}
                      onPress={() => {
                        setCompositionVariant(variant);
                        setChosenMode("composition");
                        setCoachingVisible(true);
                        setPendingScroll("image");
                      }}
                    />
                  ))}
                </View>
              )}
              <Text style={styles.caption}>
                This explains the current image. Planning studies explore future
                variations.
              </Text>
            </View>
          )}
          {domainNotes(
            "composition",
            study ? "Observe this decision" : "Composition decision",
            compositionOmit,
          )}
          {!decision &&
            guidanceDomain(composition.reason, "composition") ===
              "composition" && (
              <DetailNote
                title={study ? "Study this effect" : "Why it matters"}
                text={composition.reason}
                study={study}
                omit={[...compositionOmit, compositionNote ?? ""]}
              />
            )}
          {guidanceDomain(compositionNote, "composition") !== "composition" && (
            <Text style={styles.caption}>
              Also affects:{" "}
              {domainLabel(guidanceDomain(compositionNote, "composition"))}
            </Text>
          )}
          {actions("composition")}
        </View>
      ),
    },
    {
      key: "colour",
      title: "Colour & value",
      helper: "Value hierarchy, temperature and suggested palette.",
      content: (
        <View style={{ gap: 12 }}>
          {domainNotes("colour_value", "Colour & value strategy")}
          {guidanceDomain(colourNote, "colour_value") !== "colour_value" && (
            <Text style={styles.caption}>
              Also affects:{" "}
              {domainLabel(guidanceDomain(colourNote, "colour_value"))}
            </Text>
          )}
          <PaletteCard
            palette={result.palette}
            strategy={result.paletteStrategy}
            study={study}
            omit={[...omit, typeof colourNote === "string" ? colourNote : ""]}
          />
          {decision && actions("colour_value")}
        </View>
      ),
    },
    ...(brush.length ||
    hasImplication("technique") ||
    (decision && hasActions("technique"))
      ? [
          {
            key: "technique" as const,
            title: "Watercolor technique",
            helper: study
              ? "How to practise this handling."
              : "Brush & wash plan · suggested practice method.",
            content: (
              <View style={{ gap: 12 }}>
                {domainNotes("technique", "Handling to practise")}
                {guidanceDomain(techniqueNote, "technique") !== "technique" && (
                  <Text style={styles.caption}>
                    Also affects:{" "}
                    {domainLabel(guidanceDomain(techniqueNote, "technique"))}
                  </Text>
                )}
                <BrushWashPlanCard
                  plan={result.brushPlan}
                  study={study}
                  omit={[...omit, guardedAdvice]}
                />
                {decision && actions("technique")}
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
          {fullAdvice !== summary && (
            <FeedbackSection
              title="Full coaching note"
              text={
                nextStudyOnly(fullAdvice)
                  ? `Next study: ${fullAdvice}`
                  : fullAdvice
              }
            />
          )}
          {practice !== conciseText(practice, 2) && (
            <FeedbackSection title="Full practice note" text={practice} />
          )}
          {decision && actions("overall")}
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
    if (row.key === "planning" && !studies.length) return false;
    if (!decision) return true;
    if (row.key === "composition")
      return (
        !!activeStructure ||
        hasImplication("composition") ||
        hasActions("composition")
      );
    if (row.key === "colour")
      return (
        hasImplication("colour_value") ||
        hasActions("colour_value") ||
        usablePalette(result.palette).length > 0
      );
    return true;
  });
  const openSection =
    chosenSection === undefined
      ? (visibleRows.find((row) => row.key === promoted)?.key ?? null)
      : chosenSection;
  const availableModes = [
    ...(notes.length ? ["notes" as const] : []),
    ...(activeStructure ? ["composition" as const] : []),
    ...(roleRegions.length ? ["roles" as const] : []),
  ];
  const defaultMode =
    openSection === "composition" && activeStructure
      ? "composition"
      : availableModes.includes("notes")
        ? "notes"
        : (availableModes[0] ?? "notes");
  const visualMode =
    chosenMode && availableModes.includes(chosenMode)
      ? chosenMode
      : defaultMode;
  return (
    <ResultLayout
      imageRef={imageRef}
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
          <View style={{ gap: 10 }}>
            <SavedImage
              uri={image}
              label={
                mode === "create_reference" ? "Your photo" : "Your painting"
              }
              overlays={notes}
              study={study}
              hideNotes
              selectedNote={selectedNote}
              onImageSize={onImageSize}
              compositionOverlay={activeStructure}
              roleRegions={roleRegions}
              coachingVisible={coachingVisible}
              visualMode={visualMode}
              showComposition={coachingVisible && visualMode === "composition"}
              onSelectNote={(index) => {
                setSelectedNote(index);
                setChosenSection("visual");
                setChosenMode("notes");
                setCoachingVisible(true);
                setPendingScroll("notes");
              }}
            />
            {!!sourceSize && availableModes.length > 0 && (
              <View
                testID="visual-layer-controls"
                style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
              >
                <VisualChoice
                  title={coachingVisible ? "Hide coaching" : "Show coaching"}
                  onPress={() => setCoachingVisible((value) => !value)}
                />
                {coachingVisible &&
                  availableModes.map((layer) => (
                    <VisualChoice
                      key={layer}
                      title={
                        layer === "notes"
                          ? "Notes"
                          : layer === "composition"
                            ? "Composition"
                            : "Roles"
                      }
                      label={`${layer === "notes" ? "Notes" : layer === "composition" ? "Composition" : "Roles"} view`}
                      active={visualMode === layer}
                      onPress={() => {
                        setChosenMode(layer);
                        if (layer === "notes") {
                          setChosenSection("visual");
                          setSelectedNote((index) => index ?? 0);
                          setPendingScroll("notes");
                        }
                        if (layer === "composition")
                          setChosenSection("composition");
                        if (layer !== "notes") setSelectedNote(null);
                      }}
                    />
                  ))}
              </View>
            )}
          </View>
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
          {focused.relatedDomain && (
            <Text style={styles.caption}>
              Also affects: {domainLabel(focused.relatedDomain)}
            </Text>
          )}
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
                    onOpenChange={(open) => {
                      setChosenSection(open ? key : null);
                      if (key === "composition" && open && activeStructure)
                        setChosenMode("composition");
                      if (key === "visual" && open) setChosenMode("notes");
                      if (!open || key !== "visual") setSelectedNote(null);
                    }}
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
