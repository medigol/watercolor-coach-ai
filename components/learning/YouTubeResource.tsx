import { useState } from "react";
import { Linking, Platform, View, useWindowDimensions } from "react-native";
import type { MediaResource } from "../../learning/types";
import { validMedia, videoUrls } from "../../learning/media";
import { Action, Card, Copy, Heading } from "./LearningUI";
import YouTubeFrame from "./YouTubeFrame";
export default function YouTubeResource({
  resource,
}: {
  resource?: MediaResource;
}) {
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    [start, setStart] = useState(0);
  const { width } = useWindowDimensions();
  if (!resource || !validMedia(resource))
    return (
      <Copy muted>
        No verified video is assigned yet. The visual guide and physical
        exercise are available here.
      </Copy>
    );
  const urls = videoUrls(resource, start);
  const canEmbed =
    Platform.OS === "web" &&
    width >= 430 &&
    resource.embeddable === true &&
    resource.availability === "available" &&
    !failed;
  async function open() {
    if (urls)
      try {
        await Linking.openURL(urls.external);
      } catch {
        setFailed(true);
      }
  }
  return (
    <Card>
      <Heading level={3}>{resource.title}</Heading>
      <Copy muted>
        By {resource.creator} · {resource.language} · checked{" "}
        {resource.verifiedAt}
      </Copy>
      <Copy>{resource.purpose}</Copy>
      {loaded && canEmbed && urls ? (
        <YouTubeFrame
          key={`${resource.id}-${start}`}
          src={urls.embed}
          title={`${resource.title} by ${resource.creator}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <Copy muted>
          {failed
            ? "The demonstration could not be loaded. You can try the creator's page on YouTube, or continue with the exercise."
            : canEmbed
              ? "Loading the player connects to YouTube. Its privacy policy and terms apply. Playback stays under your control."
              : "Use YouTube for a full-size player on this device. The lesson remains available here."}
        </Copy>
      )}
      {canEmbed && !loaded && (
        <Action
          title="Load YouTube demonstration"
          secondary
          onPress={() => setLoaded(true)}
        />
      )}
      {resource.segments.map((segment) => (
        <View key={segment.start} style={{ gap: 8 }}>
          <Copy>Watch for: {segment.watchFor}</Copy>
          <Action
            title={`Start ${segment.title} at ${Math.floor(segment.start / 60)}:${String(segment.start % 60).padStart(2, "0")}`}
            secondary
            onPress={() => {
              setStart(segment.start);
              setLoaded(true);
            }}
          />
        </View>
      ))}
      <Action
        title="Open attributed video on YouTube"
        secondary
        onPress={open}
      />
      <Copy muted>
        The original player controls and branding remain visible. Return here
        when you are ready to paint.
      </Copy>
    </Card>
  );
}
