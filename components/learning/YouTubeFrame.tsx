import type { MutableRefObject } from "react";
import { Text } from "react-native";
import type { PlaybackCue } from "../../learning/videoTypes";
import type { PlayerNotice } from "../../learning/videoPlayer";
export interface VideoControls {
  play(): void;
  pause(): void;
  replay(): void;
}
export interface YouTubeFrameProps {
  src: string;
  title: string;
  cue: PlaybackCue;
  /** Explicit original-video preview, never an approved segment. */
  allowOriginal?: boolean;
  controls: MutableRefObject<VideoControls | null>;
  onState: (notice: PlayerNotice) => void;
}
export default function YouTubeFrame(_: YouTubeFrameProps) {
  return (
    <Text>
      Use the attributed YouTube link on this device. Your lesson remains open
      here.
    </Text>
  );
}
