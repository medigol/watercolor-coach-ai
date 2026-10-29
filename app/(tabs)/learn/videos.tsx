import { useCallback, useRef, useState } from "react";
import { Platform, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { previewCandidates } from "../../../learning/videoPreviewCatalogue";
import { previewMatches } from "../../../learning/videoPreview";
import { defaultPreviewWindow, orderVideoPreviews, previewLearningContext, previewSessionPlan, previewWindowSummary, videoLearningGuides } from "../../../learning/videoLearning";
import { itemById } from "../../../learning/content";
import { useLearning } from "../../../providers/LearningProvider";
import { goalLabels } from "../../../learning/catalogue";
import { Action, Choices, Copy, Disclosure, Heading, LearnScreen, TextLink, learnStyles } from "../../../components/learning/LearningUI";
import PreviewVideoPlayer from "../../../components/learning/PreviewVideoPlayer";
import PreviewReviewForm from "../../../components/learning/PreviewReviewForm";
import { colors } from "../../../components/theme";

export default function VideoPreviewLibrary() {
  const params = useLocalSearchParams<{ candidate?: string; lesson?: string; step?: string; review?: string }>();
  const { width } = useWindowDimensions(), { state } = useLearning();
  const [launch, setLaunch] = useState<string | null>(null), [level, setLevel] = useState("all");
  const [windowId, setWindowId] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null), practice = useRef<View>(null);
  const selected = previewCandidates.find(c => c.id === params.candidate);
  const lesson = typeof params.lesson === "string" && itemById(params.lesson) ? params.lesson : undefined;
  const step = lesson && typeof params.step === "string" && itemById(lesson)!.steps.some(s => s.id === params.step) ? params.step : undefined;
  const context = { lesson, step }, reviewMode = params.review === "1";
  const guide = selected ? videoLearningGuides[selected.id] : undefined;
  const learning = selected ? previewLearningContext(selected, context, state.profile) : undefined;
  const activeWindow = selected ? windowId ?? defaultPreviewWindow(selected, context) : "original";
  const candidates = orderVideoPreviews(previewCandidates.filter(c => previewMatches(c, lesson, step) &&
    (level === "all" || (level === "advanced" ? c.advancedOnly : !c.advancedOnly))), context, state.profile);
  useFocusEffect(useCallback(() => () => setLaunch(null), []));
  function choose(id: string) {
    setLaunch(id); setWindowId(null);
    router.setParams({ candidate: id });
  }
  function back() {
    setLaunch(null); setWindowId(null);
    router.setParams({ candidate: undefined, review: undefined });
  }
  function continueLesson() {
    if (!learning) return;
    // Existing lesson route resumes its persisted step. Merely opening this link
    // never rewrites progress or marks the suggested practice complete.
    router.push({ pathname: "/learn/lesson", params: { id: learning.lessonId } });
  }
  function returnToPractice() {
    // After collapsing the player, measure its actual reflowed position. Native
    // keeps the lesson in place too; external playback never replaces its route.
    requestAnimationFrame(() => {
      if (Platform.OS === "web") {
        const node = practice.current as unknown as HTMLElement | null;
        node?.scrollIntoView({ block: "center", behavior: "instant" });
        node?.focus({ preventScroll: true });
      } else if (scroll.current && practice.current) {
        practice.current.measureLayout(scroll.current.getInnerViewNode(), (_x, y) => scroll.current?.scrollTo({ y, animated: false }));
      }
    });
  }
  return <LearnScreen nav={false} scrollRef={scroll} resetKey={selected?.id ?? `library:${lesson}:${step}`}>
    {selected && guide && learning ? <>
      <TextLink title="Back to video studies" onPress={back} />
      <Text style={learnStyles.label}>Preview · under editorial review{reviewMode ? " · owner mode" : ""}</Text>
      <Heading level={1}>{guide.title}</Heading>
      <Copy muted>{selected.creator} · {guide.level}{selected.ownerScreened ? "" : " (suggested level)"}</Copy>
      {reviewMode && <View style={learnStyles.card}>
        <Heading>Owner review tools</Heading>
        <Copy muted>Review evidence separately from learning. Save or export your observations before leaving this candidate. These tools cannot publish or approve a resource.</Copy>
        <TextLink title="Return to learner view" onPress={() => router.setParams({ review: undefined })} />
      </View>}
      <View style={{ flexDirection: width >= 1000 ? "row" : "column", gap: width >= 1000 ? 32 : 22, alignItems: "flex-start" }} testID="selected-video-preview">
        <View style={{ flex: width >= 1000 ? 1.15 : undefined, width: width >= 1000 ? undefined : "100%", minWidth: 0, gap: 16 }}>
          <PreviewVideoPlayer key={`${selected.id}:${lesson}:${step}`} candidate={selected} context={context} initiallyRequested={launch === selected.id} reviewMode={reviewMode} onWindowChange={setWindowId} onPractice={returnToPractice} />
          <View style={{ gap: 8 }} testID="video-observation-prompts">
            <Heading level={3}>What to look for</Heading>
            <Copy muted>{selected.ownerScreened ? "Owner-screened for topic fit. Use these questions while watching; exact clips remain unverified." : "Suggested viewing focus, not a report of inspected footage. Check whether the video demonstrates these decisions."}</Copy>
            {guide.prompts.map((p, i) => <Copy key={p}>{i + 1}. {p}</Copy>)}
          </View>
        </View>
        <View style={{ flex: width >= 1000 ? 1 : undefined, width: width >= 1000 ? undefined : "100%", minWidth: 0, gap: 18 }}>
          <View style={{ gap: 8 }} testID="video-learning-objectives">
            <Heading level={3}>What you’ll learn to practise</Heading>
            {guide.objectives.map(o => <Copy key={o}>• {o}</Copy>)}
            <Copy muted>{learning.reason}</Copy>
          </View>
          <View ref={practice} tabIndex={-1} accessibilityLabel="Painting exercise" testID="video-practice" style={[learnStyles.card, { backgroundColor: colors.pale, gap: 12 }]}>
            <Text style={learnStyles.label}>Try it on paper · {guide.exercise.minutes} minutes + drying</Text>
            <Heading level={3}>One small experiment</Heading>
            <Copy>{guide.exercise.action}</Copy>
            <Copy muted>Look for: {guide.exercise.success}</Copy>
            <Action title="Continue lesson" onPress={continueLesson} />
            <Copy muted>{previewSessionPlan(selected, activeWindow, state.profile?.minutes ?? 15)}</Copy>
          </View>
          {!reviewMode && <TextLink title="Owner review mode" onPress={() => router.setParams({ review: "1" })} />}
          {reviewMode && <View style={{ gap: 16 }} testID="owner-video-review">
            <Disclosure title="Research evidence and limitations" initial>
              <Copy muted>Supplied research title: {selected.researchTitle}</Copy>
              <Copy muted>{selected.ownerScreened ? "Prior owner screening confirmed clarity and topic fit; it did not approve exact clips." : "Content inspection remains pending. The teaching questions and exercise are original app suggestions."} Total duration, caption tracks, live embedding, audience classification and final clip approval remain unverified.</Copy>
              <Copy muted>Selected window: {previewWindowSummary(selected, activeWindow)}. Timing hints remain separate from observed fields. No new content viewing is claimed.</Copy>
              {selected.id === "cafe-cloud-tips" && <Copy>Unresolved source conflict: 138–162 seconds in the CSV versus 138–298 seconds in the JSON. Both proposals are preserved; neither is a default.</Copy>}
            </Disclosure>
            <PreviewReviewForm candidate={selected} selectedWindow={activeWindow} />
          </View>}
        </View>
      </View>
    </> : <>
      <Text style={learnStyles.label}>Preview · under editorial review</Text>
      <Heading level={1}>Video studies</Heading>
      <Copy>Choose a painting skill, watch with a purpose, then try a small study of your own.</Copy>
      <Copy muted>17 candidate demonstrations · exact clips are still under review. Watch opens YouTube and shares connection information; written lessons work independently.</Copy>
      {state.profile && <Copy muted>Ordered for your goal: {goalLabels[state.profile.goal].toLowerCase()}. Advanced studies remain optional.</Copy>}
      {state.currentItemId && itemById(state.currentItemId) && <TextLink title="Find videos for my current lesson" onPress={() => router.setParams({ lesson: state.currentItemId!, step: state.entries[state.currentItemId!]?.stepId, candidate: undefined })} />}
      {params.candidate && <Copy>That preview candidate is not available. No video was substituted; choose from the library below.</Copy>}
      <Disclosure title="Find a demonstration">
        <Copy>Choose your current study</Copy>
        <Choices values={[{ id: "all", label: "All studies" }, ...["water-brush", "three-values", "edge-families", "observed-structure", "quiet-landscape"].map(id => ({ id, label: itemById(id)!.title }))]} selected={lesson ?? "all"} onSelect={id => { setLevel("all"); router.setParams({ lesson: id === "all" ? undefined : id, step: undefined, candidate: undefined }); }} />
        <Copy>Experience focus</Copy>
        <Choices values={[{ id: "all", label: "All levels" }, { id: "foundation", label: "Foundation / developing" }, { id: "advanced", label: "Optional advanced studies" }]} selected={level} onSelect={setLevel} />
      </Disclosure>
      {lesson && <View style={{ gap: 6 }}>
        <Copy>{candidates.length} candidates for {itemById(lesson)!.title}{step ? ` · ${itemById(lesson)!.steps.find(s => s.id === step)!.title}` : ""}</Copy>
        <TextLink title="Show all 17 preview videos" onPress={() => { setLevel("all"); router.setParams({ lesson: undefined, step: undefined }); }} />
      </View>}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }} testID="preview-candidate-list">
        {candidates.map(c => {
          const g = videoLearningGuides[c.id], d = defaultPreviewWindow(c, context);
          return <View key={c.id} testID={`preview-candidate-${c.id}`} style={[learnStyles.card, { width: width >= 1100 ? "31.8%" : width >= 700 ? "48%" : "100%", minWidth: 0, gap: 10, justifyContent: "space-between" }]}>
            <Text style={learnStyles.label}>{g.level}</Text>
            <Heading level={3}>{g.title}</Heading>
            <Copy muted>{c.creator}</Copy>
            <Copy>{g.objectives[0]}</Copy>
            <Copy muted>{previewWindowSummary(c, d)}</Copy>
            <Action title={`Watch ${g.title}`} label="Watch study" onPress={() => choose(c.id)} />
          </View>;
        })}
      </View>
      {!candidates.length && <Copy>No candidate is mapped to this study and level. Use your written lesson or choose All studies and All levels.</Copy>}
    </>}
  </LearnScreen>;
}
