import type { OfficialPlayer, PlaybackState, PlaybackCue } from "./videoTypes";
export type PlayerNotice = { state: PlaybackState; message: string };
export function playerFailure(code: number): PlayerNotice {
  if ([101, 150].includes(code))
    return {
      state: "restricted",
      message:
        "The creator has restricted embedding. Open the original video on YouTube, or keep painting here.",
    };
  if (code === 100)
    return {
      state: "unavailable",
      message:
        "YouTube reports that this video is unavailable. Your exercise and progress remain here.",
    };
  if (code === 153)
    return {
      state: "error",
      message:
        "YouTube could not identify this player request. Use the original YouTube link; no lesson progress has changed.",
    };
  return {
    state: "error",
    message:
      "The demonstration could not be played. Open YouTube or continue with the written exercise.",
  };
}
/** Thin official-API controller. No transcript, stream access or watch logging. */
export class SegmentPlayback {
  private alive = true;
  private failed = false;
  private cue: PlaybackCue;
  private stopping = false;
  constructor(
    private player: OfficialPlayer,
    cue: PlaybackCue,
    private notify: (value: PlayerNotice) => void,
  ) {
    this.cue = { ...cue };
  }
  select(cue: PlaybackCue) {
    if (!this.alive || this.failed) return;
    this.cue = { ...cue };
    this.stopping = false;
    this.player.cueVideoById({ ...cue });
    this.notify({
      state: "ready",
      message: "Demonstration ready. Use Play to begin.",
    });
  }
  replay() {
    if (!this.alive || this.failed) return;
    this.stopping = false;
    // Object-form load restores BOTH absolute boundaries. seekTo is not used.
    this.player.loadVideoById({ ...this.cue });
    this.notify({
      state: "loading",
      message: "Replay requested; waiting for YouTube.",
    });
  }
  play() {
    if (this.alive && !this.failed) this.player.playVideo();
  }
  pause() {
    if (this.alive) this.player.pauseVideo();
  }
  event(code: number) {
    if (!this.alive || this.failed) return;
    if (code === 1) this.stopping = false;
    if (this.stopping) return;
    if (code === 1) {
      this.notify({ state: "playing", message: "YouTube reports playback." });
      this.poll();
    } else if (code === 2)
      this.notify({
        state: "paused",
        message: "Paused. Return to your painting whenever you are ready.",
      });
    else if (code === 5 || code === -1)
      this.notify({
        state: "ready",
        message: "Demonstration ready. Use Play to begin.",
      });
    else if (code === 0) {
      const t = this.player.getCurrentTime();
      this.notify(
        this.cue.endSeconds !== undefined &&
          t >= this.cue.endSeconds - 0.75 && t <= this.cue.endSeconds + 1
          ? {
              state: "segment-ended",
              message:
                "Viewing window finished. Try the physical exercise; watching does not complete it.",
            }
          : {
              state: "paused",
              message: this.cue.endSeconds === undefined
                ? "Original-video playback ended. Watching does not complete a painting exercise."
                : "Playback stopped before the suggested endpoint. You can replay or return to practice.",
            },
      );
    }
  }
  poll() {
    if (!this.alive || this.stopping || this.player.getPlayerState() !== 1)
      return;
    const t = this.player.getCurrentTime();
    if (!Number.isFinite(t)) return;
    const end = this.cue.endSeconds;
    if ((end !== undefined && t >= end) || t < this.cue.startSeconds - 1) {
      this.stopping = true;
      this.player.pauseVideo();
      const nearEnd = end !== undefined && t >= end && t <= end + 1;
      this.notify(
        nearEnd
          ? {
              state: "segment-ended",
              message:
                "Viewing window finished. Compare the result in your own practice.",
            }
          : {
              state: "outside-segment",
              message:
                "The player moved outside this viewing window. Replay restores its start and end; seeking is not frame-exact.",
            },
      );
    }
  }
  error(code: number) {
    if (this.alive) {
      this.failed = true;
      this.stopping = true;
      try {
        this.player.pauseVideo();
      } finally {
        this.notify(playerFailure(code));
      }
    }
  }
  dispose() {
    if (!this.alive) return;
    this.alive = false;
    try {
      this.player.pauseVideo();
    } finally {
      this.player.destroy();
    }
  }
}
