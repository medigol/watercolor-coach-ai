import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import YouTubeFrame, { type VideoControls } from "./YouTubeFrame";
import VideoPlayPoster from "./VideoPlayPoster";
import { Action, Choices, Copy, Disclosure, TextLink, learnStyles } from "./LearningUI";
import { defaultCaptions, displayTime } from "../../learning/media";
import { previewUrls, type PreviewCandidate } from "../../learning/videoPreview";
import { defaultPreviewWindow, previewWindowSummary, videoLearningGuides, type VideoContext } from "../../learning/videoLearning";
import type { CaptionPreferences } from "../../learning/videoTypes";
import type { PlayerNotice } from "../../learning/videoPlayer";

export default function PreviewVideoPlayer({ candidate, context, initiallyRequested = false, reviewMode = false, onWindowChange, onPractice }: {
  candidate: PreviewCandidate;
  context: VideoContext;
  /** Ephemeral in-app Watch gesture, never derived from a URL or local storage. */
  initiallyRequested?: boolean;
  reviewMode?: boolean;
  onWindowChange: (id: string) => void;
  onPractice: () => void;
}) {
  const [selected, setSelected] = useState(() => defaultPreviewWindow(candidate, context));
  const [width, setWidth] = useState(0), [requested, setRequested] = useState(initiallyRequested);
  const [captions, setCaptions] = useState<CaptionPreferences>(defaultCaptions);
  const [frame, setFrame] = useState<{ url: string; revision: number; original: boolean } | null>(null);
  const [notice, setNotice] = useState<PlayerNotice | null>(null);
  const controls = useRef<VideoControls | null>(null), launched = useRef(false);
  const onChange = useRef(onWindowChange); onChange.current = onWindowChange;
  useEffect(() => onChange.current(selected), [selected]);
  useFocusEffect(useCallback(() => () => {
    controls.current?.pause(); setFrame(null); setNotice(null); setRequested(false); launched.current = false;
  }, []));
  const origin = Platform.OS === "web" ? window.location.origin : undefined;
  const urls = previewUrls(candidate, selected, captions, origin)!;
  const canEmbed = Platform.OS === "web" && width >= 200;
  const failed = !!notice && ["error", "unavailable", "restricted"].includes(notice.state);
  function load() {
    setRequested(true); launched.current = true;
    setNotice({ state: "loading", message: "Opening YouTube…" });
    setFrame(f => ({ url: urls.embed, original: urls.cue.endSeconds === undefined, revision: (f?.revision ?? 0) + 1 }));
  }
  // A library Watch card is already a deliberate load action. Wait for available
  // width, not a second button. Reload/deep links never set this ephemeral intent.
  useEffect(() => {
    if (requested && canEmbed && !launched.current) load();
    else if (requested && Platform.OS !== "web" && !launched.current) {
      launched.current = true; void external(false);
    }
  }, [requested, canEmbed]);
  async function external(full: boolean) {
    controls.current?.pause();
    try { await Linking.openURL(full ? urls.full : urls.external); }
    catch { setNotice({ state: "error", message: "The YouTube link could not open. You can still try the exercise below." }); }
  }
  const windowChoices = [
    ...candidate.windows.filter(w => reviewMode || (w.source !== "conflicting-publisher-hint" && !candidate.windows.some(other => other.source === "conflicting-publisher-hint" && other.start === w.start)))
      .map(w => ({ id: w.id, label: `${w.label}: ${displayTime(w.start)}${w.end === undefined ? " onwards · end pending" : `–${displayTime(w.end)}`} · unverified` })),
    { id: "original", label: "Full video · timestamps pending review" },
  ];
  function select(id: string) {
    controls.current?.pause();
    const next = previewUrls(candidate, id, captions, origin)!;
    setSelected(id); setNotice(null);
    if (frame && (frame.original !== (next.cue.endSeconds === undefined) || failed)) {
      // The existing frame cues bounded-to-bounded changes. Remount only when
      // its initial URL policy changes, or a failed provider needs recovery.
      setFrame(f => ({ url: next.embed, original: next.cue.endSeconds === undefined, revision: (f?.revision ?? 0) + 1 }));
    }
  }
  return <View testID="preview-player" onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ gap: 12 }}>
    <Copy muted>{previewWindowSummary(candidate, selected)}</Copy>
    {frame && canEmbed && !failed ? <>
      <YouTubeFrame key={frame.revision} src={frame.url} title={`${candidate.creator} · video preview`} cue={urls.cue} allowOriginal={frame.original} playOnReady controls={controls} onState={setNotice} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <Action title="Replay demonstration" secondary disabled={!controls.current} onPress={() => controls.current?.replay()} />
        <TextLink title="Return to practice" onPress={() => { controls.current?.pause(); setFrame(null); setNotice(null); setRequested(false); launched.current = false; onPractice(); }} />
      </View>
    </> : <>
      <VideoPlayPoster visual={videoLearningGuides[candidate.id].visual}
        title={failed ? "Try YouTube again" : selected === "original" ? "Watch video" : "Watch proposed segment"}
        onPress={() => canEmbed ? load() : void external(false)} />
      <Copy muted>Watch opens YouTube, which receives connection information. Playback uses its official controls.</Copy>
    </>}
    {notice && <Text role="status" accessibilityLiveRegion="polite" style={learnStyles.muted}>{notice.state === "ready" ? "Ready · use YouTube Play if needed." : notice.message}</Text>}
    <Disclosure title="Video options">
      {candidate.windows.length > 0 && <Disclosure title="Choose another chapter">
        <Choices values={windowChoices} selected={selected} onSelect={select} />
        {candidate.id === "cafe-cloud-tips" && <Copy muted>The 2:18 chapter has two conflicting proposed endpoints (2:42 and 4:58). Neither is selected by default. Both remain in owner review.</Copy>}
      </Disclosure>}
      <TextLink title="Watch full original on YouTube" onPress={() => void external(true)} />
      <Disclosure title="Playback help and privacy">
      <Copy muted>Use YouTube’s own CC menu for captions, and its controls for sound, speed and fullscreen. Available caption languages depend on the original video. Seeking is approximate; replay restores the selected start and proposed end. Watching does not complete your painting exercise.</Copy>
      <Copy muted>YouTube receives connection information when you choose Watch, including on its privacy-enhanced domain. No downloaded video or custom watch history. The written lesson works without video.</Copy>
      <TextLink title="YouTube privacy policy" onPress={() => void Linking.openURL("https://policies.google.com/privacy")} />
      <TextLink title="YouTube terms" onPress={() => void Linking.openURL("https://www.youtube.com/t/terms")} />
      </Disclosure>
    </Disclosure>
    {reviewMode && <Disclosure title="Owner caption preference test">
      <Choices values={[{ id: "default", label: "Follow YouTube settings" }, { id: "prefer", label: "Prefer captions when available" }]} selected={captions.mode} onSelect={mode => setCaptions(p => ({ ...p, mode: mode as CaptionPreferences["mode"] }))} />
      {captions.mode === "prefer" && <Choices values={[{ id: "default", label: "YouTube language" }, { id: "en", label: "English preference" }, { id: "fa", label: "Persian preference" }]} selected={captions.language} onSelect={language => setCaptions(p => ({ ...p, language: language as CaptionPreferences["language"] }))} />}
      <Copy muted>These request a preference, not an available caption track. Apply reconnects the player; check the official CC menu for actual availability.</Copy>
      {canEmbed && <Action title="Apply caption preference" secondary onPress={load} />}
    </Disclosure>}
  </View>;
}
