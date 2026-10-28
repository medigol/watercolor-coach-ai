import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform, View, Text } from "react-native";
import { useFocusEffect } from "expo-router";
import type { MediaResource } from "../../learning/types";
import type { CaptionPreferences } from "../../learning/videoTypes";
import type { PlayerNotice } from "../../learning/videoPlayer";
import {
  defaultCaptions,
  displayTime,
  publicationErrors,
  videoUrls,
} from "../../learning/media";
import {
  Action,
  Choices,
  Copy,
  Disclosure,
  Heading,
  TextLink,
  learnStyles,
} from "./LearningUI";
import YouTubeFrame, { type VideoControls } from "./YouTubeFrame";
export default function YouTubeResource({
  resource,
  segmentId,
  reason,
  allowedSegmentIds,
  onPractice,
}: {
  resource?: MediaResource;
  segmentId?: string;
  reason?: string;
  allowedSegmentIds?: string[];
  onPractice?: () => void;
}) {
  const [segmentOptions, setSegmentOptions] = useState(false);
  const [selected, setSelected] = useState(
      segmentId ?? resource?.segments[0]?.id,
    ),
    [width, setWidth] = useState(0);
  const [frame, setFrame] = useState<{ url: string; revision: number } | null>(
      null,
    ),
    [notice, setNotice] = useState<PlayerNotice | null>(null);
  const [captions, setCaptions] = useState<CaptionPreferences>(defaultCaptions);
  const controls = useRef<VideoControls | null>(null);
  useEffect(() => {
    if (segmentId) {
      controls.current?.pause();
      setSelected(segmentId);
    }
  }, [segmentId]);
  useFocusEffect(
    useCallback(
      () => () => {
        // Tab screens can remain mounted: route blur must explicitly stop playback.
        controls.current?.pause();
        setFrame(null);
        setNotice(null);
      },
      [],
    ),
  );
  if (!resource || publicationErrors(resource).length)
    return (
      <Copy muted>
        No verified video is assigned yet. The visual guide and physical
        exercise are available here.
      </Copy>
    );
  const segments = resource.segments.filter(
    (s) => !allowedSegmentIds || allowedSegmentIds.includes(s.id),
  );
  const segment =
    segments.find((s) => s.id === selected) ??
    segments.find((s) => s.id === segmentId) ??
    segments[0];
  if (!segment)
    return (
      <Copy muted>
        No verified demonstration matches this step. Continue with the physical
        exercise.
      </Copy>
    );
  const canEmbed =
    Platform.OS === "web" && width >= 200 && resource.embeddable === true;
  const origin = Platform.OS === "web" ? window.location.origin : undefined;
  const urls = videoUrls(
    resource,
    segment.start,
    segment.end,
    captions,
    origin,
  )!;
  const failed =
    notice && ["error", "unavailable", "restricted"].includes(notice.state);
  function load() {
    setNotice({
      state: "loading",
      message: "Waiting for the official player…",
    });
    setFrame((f) => ({ url: urls.embed, revision: (f?.revision ?? 0) + 1 }));
  }
  async function external(full = false) {
    controls.current?.pause();
    try {
      await Linking.openURL(full ? urls.full : urls.external);
      setNotice({
        state: "paused",
        message:
          "YouTube link requested. Your current lesson and step stay here.",
      });
    } catch {
      setNotice({
        state: "error",
        message:
          "The YouTube link could not open. Continue with the written exercise.",
      });
    }
  }
  function practice() {
    setFrame(null);
    setNotice(null);
    onPractice?.();
  }
  return (
    <View
      testID="demonstration-card"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ gap: 14 }}
    >
      <Text style={learnStyles.label}>
        Optional demonstration · {displayTime(segment.durationSeconds)}
      </Text>
      <Heading level={3}>{segment.title}</Heading>
      <Copy muted>
        By {resource.creator} · {displayTime(segment.start)}–
        {displayTime(segment.end)} of the original
      </Copy>
      <Copy>{segment.objective}</Copy>

      <View style={{ gap: 6 }}>
        <Text style={learnStyles.label}>Prepare · look for</Text>
        {segment.prompts.map((p) => (
          <Copy key={p}>• {p}</Copy>
        ))}
        <Copy muted>{segment.misconception}</Copy>
      </View>
      {segments.length > 1 && (
        <>
          <TextLink
            title="Choose verified segment"
            expanded={segmentOptions}
            onPress={() => setSegmentOptions((v) => !v)}
          />
          {segmentOptions && (
            <Choices
              values={segments.map((s) => ({
                id: s.id,
                label: `${s.title} · ${displayTime(s.start)}–${displayTime(s.end)}`,
              }))}
              selected={segment.id}
              onSelect={(id) => {
                controls.current?.pause();
                setSelected(id);
                setSegmentOptions(false);
                setNotice(null);
              }}
            />
          )}
        </>
      )}
      {frame && canEmbed && !failed ? (
        <>
          <YouTubeFrame
            key={`${resource.id}:${frame.revision}`}
            src={frame.url}
            title={`${resource.title} by ${resource.creator}`}
            cue={{
              videoId: resource.videoId,
              startSeconds: segment.start,
              endSeconds: segment.end,
            }}
            controls={controls}
            onState={setNotice}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Action
              title="Replay this demonstration"
              secondary
              disabled={!controls.current}
              onPress={() => controls.current?.replay()}
            />
          </View>
          <Copy muted>
            Suggested viewing window. Seeking may leave it; replay restores both
            boundaries. YouTube seeking is not frame-exact.
          </Copy>
        </>
      ) : (
        <>
          {failed ? (
            <Copy>{notice.message}</Copy>
          ) : (
            <Copy muted>
              {canEmbed
                ? "Load only when you are ready. YouTube receives connection information; its terms and privacy practices apply."
                : "Use the original YouTube player on this device. This lesson stays open for your practice."}
            </Copy>
          )}
          {canEmbed && (
            <Action
              title={
                failed
                  ? "Retry YouTube connection"
                  : "Load YouTube demonstration"
              }
              secondary
              onPress={load}
            />
          )}
          {!canEmbed && (
            <Action
              title="Watch demonstration on YouTube"
              secondary
              onPress={() => external()}
            />
          )}
        </>
      )}
      {notice && !failed && (
        <Text
          role="status"
          accessibilityLiveRegion="polite"
          style={learnStyles.muted}
        >
          {notice.message}
        </Text>
      )}
      <TextLink title="Return to the painting exercise" onPress={practice} />
      <TextLink
        title="Watch full video on YouTube"
        onPress={() => external(true)}
      />
      <Disclosure title="Caption preferences">
        {canEmbed ? (
          <>
            <Choices
              values={[
                { id: "default", label: "Follow YouTube settings" },
                { id: "prefer", label: "Prefer captions when available" },
              ]}
              selected={captions.mode}
              onSelect={(mode) =>
                setCaptions((p) => ({
                  ...p,
                  mode: mode as CaptionPreferences["mode"],
                }))
              }
            />
            {captions.mode === "prefer" && (
              <Choices
                values={[
                  { id: "default", label: "YouTube language" },
                  { id: "en", label: "English preference" },
                  { id: "fa", label: "Persian preference" },
                ]}
                selected={captions.language}
                onSelect={(language) =>
                  setCaptions((p) => ({
                    ...p,
                    language: language as CaptionPreferences["language"],
                  }))
                }
              />
            )}
            <Copy muted>
              Requests apply on the next player load, not a guaranteed track.
              YouTube controls captions and translation. These choices last
              while this card is open; lesson progress is unchanged.
            </Copy>
          </>
        ) : (
          <Copy muted>
            Use the caption controls on YouTube. These in-app preferences apply
            only to embedded web playback.
          </Copy>
        )}
        <Copy muted>
          {resource.captions.presence === "unknown"
            ? "Caption availability and languages have not been confirmed for this video."
            : resource.captions.presence === "absent"
              ? "No captions were observed at the last review."
              : `Observed captions: ${resource.captions.languages.join(", ") || "language not confirmed"}; ${resource.captions.kind}. Translation accuracy is unverified.`}
        </Copy>
        {frame && canEmbed && (
          <Action
            title="Apply caption preferences and reload player"
            secondary
            onPress={load}
          />
        )}
      </Disclosure>
      {reason && (
        <Disclosure title="Why this demonstration">
          <Copy>{reason}</Copy>
        </Disclosure>
      )}
      <Disclosure title="Understand the decision">
        <Copy>{segment.explanation}</Copy>
        <Copy muted>{segment.limitations.join(" ")}</Copy>
      </Disclosure>
      <View style={{ gap: 8 }}>
        <Text style={learnStyles.label}>Practise · change one variable</Text>
        <Copy>{segment.practice.action}</Copy>
        <Copy muted>
          Change: {segment.practice.variable}. Keep:{" "}
          {segment.practice.constants.join(" · ")}
        </Copy>
        <Copy muted>Look for: {segment.practice.success.join(" · ")}</Copy>
        <Copy muted>Reflect: {segment.practice.reflection}</Copy>
      </View>
      <Disclosure title="Source and privacy">
        <Copy>
          {resource.title} · {resource.creator} · original language:{" "}
          {resource.language}
        </Copy>
        <Copy muted>{segment.practice.materials.join(" · ")}</Copy>
        <Copy muted>
          Embedded through the official YouTube player. No downloaded clip,
          transcript or custom watch history. Loading can share information with
          YouTube even on its privacy-enhanced domain.
        </Copy>
        <TextLink
          title="YouTube privacy policy"
          onPress={() => {
            void Linking.openURL("https://policies.google.com/privacy");
          }}
        />
        <TextLink
          title="YouTube terms"
          onPress={() => {
            void Linking.openURL(
              "https://www.youtube.com/static?template=terms",
            );
          }}
        />
      </Disclosure>
    </View>
  );
}
