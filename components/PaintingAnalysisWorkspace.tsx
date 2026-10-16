import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  type PaintingAnalysisResult,
  projectPaintingAnalysis,
} from "../shared/paintingAnalysis";
import { workspaceTeaching } from "../shared/coachingWorkspace";
import { sameLearningInsight } from "../shared/coachingEvidence";
import {
  objectDesignSuggestion,
  qualityRationaleText,
  separateStudyText,
  purposefulFigureAdvice,
} from "../shared/coachingLanguage";
import {
  drawableCompositionOverlay,
  compositionIdentity,
} from "../shared/visualMetadata";
import {
  archetypeLabel,
  compositionTeachingRows,
} from "../lib/compositionArchetypes";
import { planCanonicalVisualRoles } from "../lib/visualRoles";
import { curatedCoachingNotes, VisualCoachingNotes } from "./CoachingOverlay";
import { SavedImage } from "./SavedResultState";
import type { ImageSize } from "../shared/imageGeometry";
import ColourValueAnalysis from "./ColourValueAnalysis";
import EvidenceVisual from "./EvidenceVisual";
import {
  allocateEvidence,
  insightEvidence,
  colourEvidence,
  compositionEvidence,
  evidenceIdentity,
  type EvidencePlacement,
} from "../lib/teachingEvidence";
import BrushWashPlanCard from "./BrushWashPlanCard";
import { colors, styles } from "./ui";
import { design } from "./theme";

function Section({
  title,
  icon,
  children,
  initiallyOpen = false,
  reveal,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  children: ReactNode;
  initiallyOpen?: boolean;
  reveal?: number;
}) {
  const { width } = useWindowDimensions();
  const [choice, setChoice] = useState<boolean>();
  useEffect(() => {
    if (reveal) setChoice(true);
  }, [reveal]);
  const open = choice ?? (initiallyOpen || width >= 960);
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderColor: colors.border,
        paddingTop: design.space.lg,
        gap: 14,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={() => setChoice(!open)}
        style={{
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
          minHeight: design.touch,
        }}
      >
        <Ionicons name={icon} size={21} color={colors.accent} />
        <Text
          style={[styles.heading, { flex: 1, fontSize: design.type.section }]}
        >
          {title}
        </Text>
        <Text accessible={false} style={{ color: colors.accent, fontSize: 22 }}>
          {open ? "−" : "+"}
        </Text>
      </Pressable>
      {open && children}
    </View>
  );
}
function Choice({
  title,
  active,
  onPress,
  disabled = false,
  accessibilityLabel,
  grid = false,
}: {
  title: string;
  active?: boolean;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  grid?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      aria-pressed={!!active}
      accessibilityState={{ selected: !!active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: design.radius.control,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.border,
        backgroundColor: active ? colors.pale : colors.elevated,
        opacity: disabled ? 0.45 : 1,
        flexBasis: grid ? "47%" : undefined,
        flexGrow: grid ? 1 : undefined,
        justifyContent: "center",
        alignItems: "center",
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
export default function PaintingAnalysisWorkspace({
  source,
  image,
  isSaved,
  warning,
}: {
  source: PaintingAnalysisResult;
  image?: string;
  isSaved: boolean;
  warning?: string;
}) {
  const { width, height } = useWindowDimensions(),
    wide = Platform.OS === "web" && width >= 1024;
  const c = source.canonicalAnalysis,
    teaching = workspaceTeaching(source);
  const projection = useMemo(
    () => projectPaintingAnalysis(source, "overall"),
    [source],
  );
  const notes = useMemo(
    () =>
      curatedCoachingNotes(projection.overlays).filter(
        (note) =>
          !c.visualEvidence?.some(
            (e) =>
              e.note.id === note.id &&
              teaching.omittedInsightIds.includes(e.insightId),
          ),
      ),
    [projection, c.visualEvidence, teaching.omittedInsightIds],
  );
  const [mode, setMode] = useState<"clean" | "notes" | "composition" | "roles">(
    "clean",
  );
  const [selected, setSelected] = useState<number | null>(0);
  const [showNotes, setShowNotes] = useState(false);
  const [secondary, setSecondary] = useState(false);
  const [sourceSize, setSourceSize] = useState<ImageSize | null>(null);
  const onSize = useCallback(
    (size: ImageSize | null) => setSourceSize(size),
    [],
  );
  const primary = drawableCompositionOverlay(c.composition.primary);
  const other = drawableCompositionOverlay(c.composition.secondary);
  const distinctSecondary =
    primary &&
    other &&
    compositionIdentity(primary) !== compositionIdentity(other)
      ? other
      : null;
  const structure =
    secondary && distinctSecondary ? distinctSecondary : primary;
  const roles = planCanonicalVisualRoles(c.visualRoles);
  const notesRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const evidenceRefs = useRef<Record<string, View | null>>({});
  const [revealed, setRevealed] = useState({ key: "", revision: 0 });
  const firstRecommendation = teaching.recommendations[0];
  const colourInsight = c.insights.find((i) => i.domain === "colour_value");
  const valueEvidence = colourInsight
    ? insightEvidence(source, colourInsight)
    : null;
  const requests = [
    {
      key: "composition",
      label: "Composition",
      plan: compositionEvidence(structure),
    },
    ...(firstRecommendation
      ? [
          {
            key: `insight:${firstRecommendation.insight.id}`,
            label: firstRecommendation.label,
            plan: insightEvidence(source, firstRecommendation.insight),
          },
        ]
      : []),
    ...teaching.strengths.slice(0, 1).map((i) => ({
      key: `insight:${i.id}`,
      label: "What works",
      plan: insightEvidence(source, i),
    })),
    {
      key: "value",
      label: "Value hierarchy",
      plan: valueEvidence ? { ...valueEvidence, value: true } : null,
    },
    ...teaching.studies
      .filter((i) => objectDesignSuggestion(i.action))
      .map((i) => ({
        key: `insight:${i.id}`,
        label: "Future study location",
        plan: insightEvidence(source, i),
      })),
    ...teaching.recommendations.slice(1).map(({ insight, label }) => ({
      key: `insight:${insight.id}`,
      label,
      plan: insightEvidence(source, insight),
    })),
    ...c.insights
      .filter((i) => i.domain === "technique")
      .slice(0, 1)
      .map((i) => ({
        key: "technique",
        label: "Technique evidence",
        plan: insightEvidence(source, i),
      })),
  ];
  const placements = allocateEvidence(requests);
  const showEvidence = (key: string) => {
    setRevealed((previous) => ({ key, revision: previous.revision + 1 }));
    setTimeout(() => {
      if (Platform.OS === "web") {
        const node = evidenceRefs.current[key] as unknown as {
          scrollIntoView?: (o: ScrollIntoViewOptions) => void;
        } | null;
        node?.scrollIntoView?.({ behavior: "auto", block: "center" });
      } else {
        const node = evidenceRefs.current[key],
          scroll = scrollRef.current;
        const inner = scroll?.getInnerViewNode();
        if (node && inner)
          node.measureLayout(
            inner,
            (_x, y) => scroll?.scrollTo({ y, animated: false }),
            () => {},
          );
      }
    }, 50);
  };
  const noteReferences = Object.fromEntries(
    notes.flatMap((note) => {
      const linked = c.visualEvidence?.find((e) => e.note.id === note.id);
      const insight = c.insights.find((i) => i.id === linked?.insightId);
      const plan = insight && insightEvidence(source, insight);
      const owner =
        plan &&
        Object.entries(placements).find(
          ([, p]) =>
            "plan" in p && evidenceIdentity(p.plan) === evidenceIdentity(plan),
        );
      return owner && note.id ? [[note.id, owner[0]]] : [];
    }),
  );
  const evidence = (key: string) => {
    const placement: EvidencePlacement | undefined = placements[key];
    if (!placement || !image) return null;
    if ("reference" in placement)
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`See image evidence: ${placement.reference.label}`}
          onPress={() => showEvidence(placement.reference.key)}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={[styles.caption, { color: colors.accent }]}>
            See image evidence · {placement.reference.label}
          </Text>
        </Pressable>
      );
    const noteIndex = notes.findIndex((n) => n.id === placement.plan.noteId);
    return (
      <View
        ref={(node) => {
          evidenceRefs.current[key] = node;
        }}
      >
        <EvidenceVisual
          uri={image}
          sourceSize={sourceSize}
          plan={placement.plan}
          onSelect={
            noteIndex >= 0
              ? () => {
                  setSelected(noteIndex);
                  setMode("notes");
                  setShowNotes(true);
                }
              : undefined
          }
        />
      </View>
    );
  };
  const selectNote = (index: number | null) => {
    setSelected(index);
    setShowNotes(true);
    setMode("notes");
    if (Platform.OS === "web")
      setTimeout(() => {
        const node = notesRef.current as unknown as {
          scrollIntoView?: (o: ScrollIntoViewOptions) => void;
        } | null;
        node?.scrollIntoView?.({ behavior: "auto", block: "nearest" });
      }, 0);
  };
  const domainInsights = (domain: string) =>
    c.insights.filter(
      (i) =>
        i.domain === domain &&
        !teaching.omittedInsightIds.includes(i.id) &&
        purposefulFigureAdvice(`${i.lesson} ${i.action}`) &&
        !teaching.strengths.some((s) => s.id === i.id) &&
        !teaching.studies.some((s) => s.id === i.id) &&
        !teaching.recommendations.some((r) => r.insight.id === i.id) &&
        !["clear_issue", "optional_refinement", "study_experiment"].includes(
          i.classification,
        ),
    );
  const lessons = (domain: string, omit: string[] = []) =>
    domainInsights(domain)
      .filter(
        (i, index, all) =>
          !omit.some((s) => sameLearningInsight(s, i.lesson)) &&
          !all
            .slice(0, index)
            .some((p) => sameLearningInsight(p.lesson, i.lesson)),
      )
      .slice(0, 2)
      .map((i) => (
        <View key={i.id} style={{ gap: 5 }}>
          <Text
            style={[
              styles.caption,
              {
                color:
                  i.classification === "clear_issue"
                    ? colors.warning
                    : colors.study,
                fontWeight: "600",
              },
            ]}
          >
            {
              {
                strength: "What to preserve",
                clear_issue: "Main opportunity",
                optional_refinement: "Optional refinement",
                stylistic_alternative: "Stylistic alternative",
                study_experiment: "Separate study",
              }[i.classification]
            }
          </Text>
          <Text style={styles.body}>{i.lesson}</Text>
          <Text style={styles.body}>
            {i.classification === "strength"
              ? i.action
              : separateStudyText(i.action)}
          </Text>
        </View>
      ));
  const assessment = (
    <View
      testID="overall-assessment"
      style={{
        padding: 20,
        borderRadius: design.radius.card,
        backgroundColor: colors.pale,
        gap: 10,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={[styles.caption, { fontWeight: "600", color: colors.accent }]}
      >
        OVERALL ASSESSMENT
      </Text>
      <Text style={styles.heading}>
        {
          {
            highly_resolved: "Highly resolved",
            strong: "Strong",
            competent: "Competent",
            developing: "Developing",
          }[c.qualityAssessment.level]
        }{" "}
        painting
      </Text>
      <Text style={styles.body}>
        {c.qualityAssessment.confidence < 0.65 ? "One useful reading: " : ""}
        {qualityRationaleText(c.qualityAssessment.rationale)}
      </Text>
      <Text style={[styles.body, { color: colors.accent, fontWeight: "600" }]}>
        {teaching.status}
      </Text>
    </View>
  );
  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, width: "100%", backgroundColor: colors.background }}
      contentContainerStyle={{
        alignItems: "center",
        padding: width < 600 ? 12 : 24,
        paddingBottom: 40,
      }}
    >
      <View
        testID="result-container"
        style={{ width: "100%", maxWidth: 1440, gap: 20 }}
      >
        <View style={{ gap: 6 }}>
          <Text style={styles.caption}>
            WATERCOLOR COACH · {isSaved ? "SAVED ANALYSIS" : "PAINTING STUDY"}
          </Text>
          <Text
            style={[
              styles.title,
              width < 600 ? { fontSize: 23, lineHeight: 29 } : undefined,
            ]}
          >
            Complete Painting Analysis
          </Text>
          <Text style={styles.body}>{source.title}</Text>
          {!!warning && <Text style={styles.caption}>{warning}</Text>}
        </View>
        <View
          testID={wide ? "result-columns" : "result-stack"}
          style={{
            flexDirection: wide ? "row" : "column",
            alignItems: wide ? "flex-start" : "stretch",
            gap: wide ? 24 : 20,
          }}
        >
          <View
            ref={(node) => {
              evidenceRefs.current.artwork = node;
            }}
            testID="result-visual-column"
            style={[
              { gap: 12, minWidth: 0 },
              wide ? { flex: 1.2 } : undefined,
              wide
                ? ({
                    position: "sticky",
                    top: 16,
                    alignSelf: "flex-start",
                  } as unknown as ViewStyle)
                : undefined,
            ]}
          >
            <View
              style={{
                backgroundColor: colors.elevated,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 8,
                borderRadius: design.radius.card,
              }}
            >
              {image ? (
                <SavedImage
                  uri={image}
                  label="Your painting"
                  overlays={notes}
                  hideNotes
                  study={projection.coachingMode === "study"}
                  selectedNote={selected}
                  onSelectNote={(index) => selectNote(index)}
                  onOpenNotes={() => setShowNotes(true)}
                  onImageSize={onSize}
                  compositionOverlay={structure}
                  visualMode={mode === "clean" ? "notes" : mode}
                  coachingVisible={mode !== "clean"}
                  roleRegions={roles}
                  maxImageHeight={
                    wide
                      ? Math.min(720, height - 160)
                      : Math.floor(height * 0.58)
                  }
                />
              ) : (
                <Text style={[styles.body, { padding: 20 }]}>
                  The original image is unavailable. Your saved coaching notes
                  remain readable below.
                </Text>
              )}
            </View>
            <View
              accessibilityLabel="Artwork overlay controls"
              style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
            >
              <Choice
                title={width < 600 ? "Clean" : "Clean view"}
                accessibilityLabel="Clean view"
                grid={width < 600}
                active={mode === "clean"}
                onPress={() => {
                  setMode("clean");
                  setShowNotes(false);
                }}
              />
              <Choice
                title={
                  width < 600
                    ? "Notes"
                    : `Notes${notes.length ? ` · ${notes.length}` : ""}`
                }
                accessibilityLabel={`Notes${notes.length ? ` · ${notes.length}` : ""}`}
                grid={width < 600}
                active={mode === "notes"}
                disabled={!notes.length}
                onPress={() => {
                  setMode("notes");
                  setShowNotes(!showNotes);
                }}
              />
              <Choice
                title={width < 600 ? "Composition" : "Composition overlay"}
                accessibilityLabel="Composition overlay"
                grid={width < 600}
                active={mode === "composition"}
                disabled={!structure}
                onPress={() => setMode("composition")}
              />
              <Choice
                title="Roles"
                grid={width < 600}
                active={mode === "roles"}
                disabled={!c.visualRoles.length}
                onPress={() => setMode("roles")}
              />
            </View>
            {mode === "composition" && structure && (
              <Text style={styles.caption}>
                {archetypeLabel(structure.type)} · {structure.shortExplanation}
              </Text>
            )}
            {mode === "roles" && (
              <View style={{ gap: 4 }}>
                {!roles.length && (
                  <Text style={styles.caption}>
                    Role locations are uncertain. These roles are text guidance
                    only.
                  </Text>
                )}
                {c.visualRoles.map((r) => (
                  <Text key={r.id} style={styles.caption}>
                    {r.role[0].toUpperCase() + r.role.slice(1)} · {r.area}
                  </Text>
                ))}
                <Text style={styles.caption}>
                  Supporting areas guide and structure the painting while
                  remaining subordinate to the focal group.
                </Text>
              </View>
            )}
            {showNotes && (
              <View ref={notesRef}>
                <VisualCoachingNotes
                  notes={notes}
                  selected={selected}
                  onSelect={selectNote}
                  uri={image}
                  sourceSize={sourceSize}
                  study={projection.coachingMode === "study"}
                  evidenceReferences={noteReferences}
                  onShowEvidence={showEvidence}
                />
              </View>
            )}
          </View>
          <View
            testID="result-advice-column"
            style={{
              flex: wide ? 1 : undefined,
              minWidth: 0,
              gap: 20,
              backgroundColor: colors.paper,
              padding: wide ? 20 : 16,
              borderRadius: design.radius.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {assessment}
            {!!teaching.strengths.length && (
              <View style={{ gap: 12 }}>
                <Text style={styles.heading}>What works</Text>
                {teaching.strengths.map((i) => (
                  <View
                    key={i.id}
                    style={{
                      gap: 5,
                      borderLeftWidth: 2,
                      borderColor: colors.success,
                      paddingLeft: 12,
                    }}
                  >
                    <Text style={[styles.body, { color: colors.ink }]}>
                      {i.lesson}
                    </Text>
                    <Text style={styles.caption}>{i.action}</Text>
                    {evidence(`insight:${i.id}`)}
                  </View>
                ))}
              </View>
            )}
            {!!teaching.recommendations.length && (
              <View testID="elevation-recommendations" style={{ gap: 18 }}>
                <Text style={styles.heading}>How to elevate this painting</Text>
                {teaching.recommendations.map(({ insight, label }, index) => (
                  <View
                    key={insight.id}
                    testID={`recommendation-${index}`}
                    style={{
                      gap: 8,
                      borderLeftWidth: 2,
                      borderColor:
                        insight.classification === "clear_issue"
                          ? colors.warning
                          : colors.ochre,
                      paddingLeft: 12,
                    }}
                  >
                    <Text
                      style={[
                        styles.body,
                        { fontWeight: "600", color: colors.ink },
                      ]}
                    >
                      {index + 1}. {label}
                    </Text>
                    <Text style={styles.caption}>
                      {insight.classification === "clear_issue"
                        ? "Visible technical issue"
                        : "An elevation idea, not a defect"}
                    </Text>
                    {evidence(`insight:${insight.id}`)}
                    <Text style={[styles.caption, { fontWeight: "600" }]}>
                      What I see
                    </Text>
                    <Text style={styles.body}>
                      {insight.factIds
                        .map(
                          (id) => c.facts.find((f) => f.id === id)?.observation,
                        )
                        .filter(Boolean)
                        .join(" ")}
                    </Text>
                    <Text style={[styles.caption, { fontWeight: "600" }]}>
                      Why it matters
                    </Text>
                    <Text style={styles.body}>{insight.lesson}</Text>
                    <Text style={[styles.caption, { fontWeight: "600" }]}>
                      Try in a separate study
                    </Text>
                    <Text style={styles.body}>
                      {separateStudyText(insight.action)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <Section
              title="Composition"
              icon="git-network-outline"
              initiallyOpen
              reveal={
                revealed.key === "composition" ? revealed.revision : undefined
              }
            >
              {structure && (
                <Text
                  style={[
                    styles.caption,
                    { fontWeight: "600", color: colors.accent },
                  ]}
                >
                  {archetypeLabel(structure.type)}
                </Text>
              )}
              <Text style={styles.body}>{c.composition.observation}</Text>
              {evidence("composition")}
              {structure && (
                <>
                  {!sameLearningInsight(
                    structure.shortExplanation,
                    c.composition.observation,
                  ) && (
                    <Text style={styles.body}>
                      {structure.shortExplanation}
                    </Text>
                  )}
                  {compositionTeachingRows(structure).map(([label, text]) => (
                    <View key={label} style={{ gap: 3 }}>
                      <Text
                        style={[
                          styles.caption,
                          { fontWeight: "600", color: colors.ink },
                        ]}
                      >
                        {label}
                      </Text>
                      <Text style={styles.body}>{text}</Text>
                    </View>
                  ))}
                </>
              )}
              {!!distinctSecondary && (
                <Choice
                  title={
                    secondary
                      ? "Show primary structure"
                      : "Show secondary structure"
                  }
                  onPress={() => {
                    setSecondary(!secondary);
                    setMode("composition");
                  }}
                />
              )}
              {lessons("composition", [
                c.composition.observation,
                structure?.shortExplanation ?? "",
              ])}
            </Section>
            <Section
              title="Colour & Value"
              icon="color-palette-outline"
              reveal={
                revealed.key.startsWith("colour-") || revealed.key === "value"
                  ? revealed.revision
                  : undefined
              }
            >
              <ColourValueAnalysis
                source={source}
                renderEvidence={(index) => {
                  const colour = c.colourAnalysis?.visibleColours[index];
                  const plan =
                    colour &&
                    colourEvidence(source, colour.roleId, colour.label);
                  return plan && image ? (
                    <EvidenceVisual
                      uri={image}
                      sourceSize={sourceSize}
                      plan={plan}
                    />
                  ) : null;
                }}
                renderValueEvidence={() => evidence("value")}
              />
              {lessons("colour_value", [
                c.colourAnalysis?.colourStrategy ?? "",
                c.colourAnalysis?.valueHierarchy ?? "",
              ])}
            </Section>
            <Section
              title="Watercolor technique"
              icon="brush-outline"
              reveal={
                revealed.key === "technique" ? revealed.revision : undefined
              }
            >
              <Text
                style={[
                  styles.caption,
                  { fontWeight: "600", color: colors.ink },
                ]}
              >
                Observed effect · what I see
              </Text>
              {evidence("technique")}
              {c.facts
                .filter((f) => f.domain === "technique")
                .map((f) => (
                  <Text key={f.id} style={styles.body}>
                    {f.observation}
                  </Text>
                ))}
              {lessons("technique")}
              {!!c.brushPlan?.length && (
                <>
                  <Text style={[styles.heading, { fontSize: 17 }]}>
                    Suggested practice method
                  </Text>
                  <Text style={styles.caption}>
                    A way to test a similar effect on separate paper, not a
                    reconstruction of the original process.
                  </Text>
                  <BrushWashPlanCard plan={c.brushPlan} hideHeading study />
                </>
              )}
            </Section>
            {(!!teaching.practice || !!teaching.studies.length) && (
              <Section
                title="Practice & Studies"
                icon="book-outline"
                initiallyOpen
              >
                {!!teaching.practice && (
                  <View
                    style={{
                      gap: 8,
                      padding: 16,
                      backgroundColor: colors.pale,
                      borderRadius: design.radius.control,
                    }}
                  >
                    <Text
                      style={[
                        styles.body,
                        { fontWeight: "600", color: colors.ink },
                      ]}
                    >
                      Your next 15 minutes
                    </Text>
                    <Text style={styles.body}>{teaching.practice}</Text>
                  </View>
                )}
                {teaching.studies.map((i, index) => (
                  <View
                    key={i.id}
                    style={{
                      gap: 6,
                      borderLeftWidth: 2,
                      borderColor: colors.study,
                      paddingLeft: 12,
                    }}
                  >
                    <Text style={[styles.caption, { fontWeight: "600" }]}>
                      {i.classification === "stylistic_alternative"
                        ? "Stylistic alternative"
                        : "Study experiment"}{" "}
                      · {i.domain.replace("colour_value", "Colour & Value")} · a
                      future experiment
                    </Text>
                    <Text style={styles.body}>{i.lesson}</Text>
                    {evidence(`insight:${i.id}`)}
                    <Text style={styles.body}>{i.action}</Text>
                  </View>
                ))}
              </Section>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
