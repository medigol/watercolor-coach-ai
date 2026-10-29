import { useCallback, useRef, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import YouTubeFrame, { type VideoControls } from "./YouTubeFrame";
import { Action, Choices, Copy, Disclosure, Heading, TextLink, learnStyles } from "./LearningUI";
import { defaultCaptions, displayTime } from "../../learning/media";
import { previewUrls, type PreviewCandidate } from "../../learning/videoPreview";
import type { CaptionPreferences } from "../../learning/videoTypes";
import type { PlayerNotice } from "../../learning/videoPlayer";

export default function PreviewVideoPlayer({ candidate, onWindowChange }: {
  candidate: PreviewCandidate;
  onWindowChange: (id: string) => void;
}) {
  const [selected, setSelected] = useState("original"), [width, setWidth] = useState(0);
  const [captions, setCaptions] = useState<CaptionPreferences>(defaultCaptions);
  const [frame, setFrame] = useState<{ url: string; revision: number; original: boolean } | null>(null);
  const [notice, setNotice] = useState<PlayerNotice | null>(null);
  const controls = useRef<VideoControls | null>(null);
  useFocusEffect(useCallback(() => () => {
    controls.current?.pause(); setFrame(null); setNotice(null);
  }, []));
  const origin = Platform.OS === "web" ? window.location.origin : undefined;
  const urls = previewUrls(candidate, selected, captions, origin)!;
  const canEmbed = Platform.OS === "web" && width >= 200;
  const failed = !!notice && ["error", "unavailable", "restricted"].includes(notice.state);
  const proposedWindow = candidate.windows.find(w => w.id === selected);
  function load() {
    setNotice({ state: "loading", message: "Waiting for the official YouTube player. Preview playback has not been verified." });
    setFrame(f => ({ url: urls.embed, original: urls.cue.endSeconds === undefined, revision: (f?.revision ?? 0) + 1 }));
  }
  async function external(full: boolean) {
    controls.current?.pause();
    try { await Linking.openURL(full ? urls.full : urls.external); }
    catch { setNotice({ state: "error", message: "The original YouTube link could not open. Your lesson and local review remain here." }); }
  }
  return <View testID="preview-player" onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ gap: 14 }}>
    <Heading level={3}>Optional preview playback</Heading>
    <Copy muted>Availability, captions, audience classification and embedding have not been confirmed. These candidates are not approved lesson demonstrations.</Copy>
    <Disclosure title="Original video and proposed windows">
      <Choices values={[
        { id: "original", label: "Original video · no invented endpoint" },
        ...candidate.windows.map(w => ({ id: w.id, label: `${w.label}: ${displayTime(w.start)}${w.end === undefined ? " · end unknown" : `–${displayTime(w.end)}`} · UNVERIFIED` })),
      ]} selected={selected} onSelect={id => {
        controls.current?.pause();
        const next = previewUrls(candidate, id, captions, origin)!;
        // Preserve the same official player for bounded-to-bounded switches.
        // An original/segment mode change needs a matching initial URL policy.
        if (frame?.original !== (next.cue.endSeconds === undefined) || failed) setFrame(null);
        setSelected(id); onWindowChange(id); setNotice(null);
      }} />
      {candidate.id === "cafe-cloud-tips" && <Copy>Unresolved source conflict: the 138-second chapter ends at 162 in the CSV and at 298 in the JSON. Both remain publisher hints; neither is a verified clip.</Copy>}
    </Disclosure>
    <Copy>{proposedWindow
      ? `Unverified ${proposedWindow.source}: starts at ${displayTime(proposedWindow.start)}${proposedWindow.end === undefined ? "; endpoint unknown — original playback continues." : ` and suggests ${displayTime(proposedWindow.end)} as the end.`}`
      : "Original-video mode. No duration or instructional boundary is assumed."}</Copy>
    {frame && canEmbed && !failed ? <>
      <YouTubeFrame key={frame.revision} src={frame.url} title={`${candidate.creator} · unverified video preview`} cue={urls.cue} allowOriginal={frame.original} controls={controls} onState={setNotice} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Action title="Play preview" secondary disabled={!controls.current} onPress={() => controls.current?.play()} />
        <Action title="Pause preview" secondary onPress={() => controls.current?.pause()} />
        <Action title="Replay preview" secondary disabled={!controls.current} onPress={() => controls.current?.replay()} />
      </View>
      <Copy muted>Use the official player controls for seeking, sound, fullscreen and speed. Seeking is approximate; replay restores the selected start and any proposed end. Watching never completes a lesson.</Copy>
    </> : <>
      <Copy muted>{canEmbed ? "Click to load. YouTube receives connection information under its own terms and privacy practices, including on its privacy-enhanced domain." : "Use the original YouTube link on this device. The lesson remains available without video."}</Copy>
      {canEmbed && <Action title={failed ? "Retry preview connection" : "Load YouTube preview"} secondary onPress={load} />}
    </>}
    {notice && <Text role="status" accessibilityLiveRegion="polite" style={learnStyles.muted}>{notice.message}</Text>}
    <TextLink title="Close player and keep practising" onPress={() => { controls.current?.pause(); setFrame(null); setNotice(null); }} />
    <TextLink title="Watch full original on YouTube" onPress={() => void external(true)} />
    {selected !== "original" && <TextLink title="Open original at proposed start" onPress={() => void external(false)} />}
    <Disclosure title="Preview caption preferences">
      <Choices values={[{ id: "default", label: "Follow YouTube settings" }, { id: "prefer", label: "Prefer captions when available" }]} selected={captions.mode} onSelect={mode => setCaptions(p => ({ ...p, mode: mode as CaptionPreferences["mode"] }))} />
      {captions.mode === "prefer" && <Choices values={[{ id: "default", label: "YouTube language" }, { id: "en", label: "English preference" }, { id: "fa", label: "Persian preference" }]} selected={captions.language} onSelect={language => setCaptions(p => ({ ...p, language: language as CaptionPreferences["language"] }))} />}
      <Copy muted>Preferences apply on the next explicit load. A requested language is not a confirmed caption track. Check the official CC menu; caption availability and translation accuracy are unverified.</Copy>
      {frame && canEmbed && <Action title="Apply preview captions and reload" secondary onPress={load} />}
    </Disclosure>
    <Disclosure title="YouTube terms and privacy">
      <Copy muted>Official controls, branding and advertisements are preserved. No downloaded media, transcripts, custom watch history or automatic painting evaluation.</Copy>
      <TextLink title="YouTube privacy policy" onPress={() => void Linking.openURL("https://policies.google.com/privacy")} />
      <TextLink title="YouTube terms" onPress={() => void Linking.openURL("https://www.youtube.com/t/terms")} />
    </Disclosure>
  </View>;
}
