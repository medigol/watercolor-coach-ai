import { useEffect, useState } from "react";
import { Linking, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { previewCandidates } from "../../../learning/videoPreviewCatalogue";
import { previewMatches } from "../../../learning/videoPreview";
import { itemById } from "../../../learning/content";
import { Action, Copy, Heading, LearnScreen, TextLink, learnStyles } from "../../../components/learning/LearningUI";
import PreviewVideoPlayer from "../../../components/learning/PreviewVideoPlayer";
import PreviewReviewForm from "../../../components/learning/PreviewReviewForm";

export default function VideoPreviewLibrary() {
  const params = useLocalSearchParams<{ candidate?: string; lesson?: string; step?: string }>();
  const { width } = useWindowDimensions();
  const [windowId, setWindowId] = useState("original");
  const selected = previewCandidates.find(c => c.id === params.candidate);
  useEffect(() => setWindowId("original"), [selected?.id]);
  const lesson = typeof params.lesson === "string" && itemById(params.lesson) ? params.lesson : undefined;
  const step = typeof params.step === "string" ? params.step : undefined;
  const candidates = previewCandidates.filter(c => previewMatches(c, lesson, step));
  function choose(id: string) { setWindowId("original"); router.setParams({ candidate: id }); }
  return <LearnScreen resetKey={selected?.id ?? `library:${lesson}:${step}`}>
    <Text style={learnStyles.label}>Preview / Under Editorial Review</Text>
    <Heading level={1}>Video Library — Preview</Heading>
    <Copy>17 research candidates · including 3 optional Javid Tabatabaei demonstrations for intermediate and advanced painters.</Copy>
    <Copy muted>Research titles and topic mappings are provisional, not professionally verified instruction. Four owner screenings and their timing proposals are preserved; exact clips, total durations, captions, current playback and final educational approval remain unverified. Original lessons work without video.</Copy>
    {params.candidate && !selected && <Copy>That preview candidate is not available. No video was substituted; choose from the library below.</Copy>}
    {selected && <View style={{ gap: 20 }} testID="selected-video-preview">
      <TextLink title="Back to all 17 preview candidates" onPress={() => router.setParams({ candidate: undefined, lesson: undefined, step: undefined })} />
      <Text style={learnStyles.label}>{selected.creator}{selected.advancedOnly ? " · optional intermediate / advanced" : ""}</Text>
      <Heading>{selected.researchTitle}</Heading>
      <Copy muted>Research title / descriptive label; exact original title has not been independently rechecked. {selected.ownerScreened ? "Previously owner-screened for clarity and lesson fit; not exact-clip approval." : "Research candidate; content inspection is still required."}</Copy>
      <View style={{ flexDirection: width >= 1000 ? "row" : "column", gap: 32, alignItems: "flex-start" }}>
        <View style={{ flex: width >= 1000 ? 1.1 : undefined, width: width >= 1000 ? undefined : "100%", minWidth: 0 }}>
          <PreviewVideoPlayer key={selected.id} candidate={selected} onWindowChange={setWindowId} />
        </View>
        <View style={{ flex: width >= 1000 ? 1 : undefined, width: width >= 1000 ? undefined : "100%", minWidth: 0, gap: 16 }}>
          <Heading level={3}>Related studies</Heading>
          <Copy muted>Possible teaching context; suitability of the actual video remains under review. Style or impressive painting alone does not establish a lesson match.</Copy>
          {[...new Set(selected.related.map(r => r.lessonId))].map(id => <TextLink key={id} title={`Return to ${itemById(id)!.title}`} onPress={() => router.push({ pathname: "/learn/lesson", params: { id } })} />)}
          <PreviewReviewForm candidate={selected} selectedWindow={windowId} />
        </View>
      </View>
    </View>}
    {lesson && !selected && <View style={{ gap: 8 }}>
      <Copy>Showing {candidates.length} possible previews for {itemById(lesson)!.title}{step ? ` · ${itemById(lesson)!.steps.find(s => s.id === step)?.title ?? "this step"}` : ""}. These are not approved recommendations.</Copy>
      <TextLink title="Show all 17 preview videos" onPress={() => router.setParams({ lesson: undefined, step: undefined })} />
    </View>}
    {!selected && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }} testID="preview-candidate-list">
      {candidates.map(c => <View key={c.id} testID={`preview-candidate-${c.id}`} style={[learnStyles.card, { width: width >= 1100 ? "31.8%" : width >= 700 ? "48%" : "100%", minWidth: 0, justifyContent: "space-between" }]}>
        <Text style={learnStyles.label}>{c.creator}</Text>
        <Heading level={3}>{c.researchTitle}</Heading>
        <Copy muted>{c.advancedOnly ? "Optional · intermediate / advanced" : "Foundation / developing — proposed level"}</Copy>
        <Copy muted>Topics: {[...new Set(c.related.map(r => itemById(r.lessonId)!.title))].join(" · ")}</Copy>
        <Copy muted>{c.ownerScreened ? "Owner-screened · exact segments unapproved" : "Research candidate · teaching not verified"}</Copy>
        <Action title={`Preview ${c.id}`} label="Open video preview" secondary onPress={() => choose(c.id)} />
        <TextLink title={`Original YouTube video · ${c.id}`} label="Original YouTube link" onPress={() => void Linking.openURL(c.url).catch(() => {})} />
      </View>)}
    </View>}
    {!selected && !candidates.length && <Copy>No candidate is mapped to this step. Use the original lesson or browse the full preview library.</Copy>}
  </LearnScreen>;
}
