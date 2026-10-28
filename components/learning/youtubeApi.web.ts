import type { OfficialPlayer } from "../../learning/videoTypes";
interface YTEvents {
  onReady(): void;
  onStateChange(e: { data: number }): void;
  onError(e: { data: number }): void;
}
interface YoutubeAPI {
  Player: new (
    node: HTMLIFrameElement,
    config: { events: YTEvents },
  ) => OfficialPlayer;
}
type YoutubeWindow = Window & {
  YT?: YoutubeAPI;
  onYouTubeIframeAPIReady?: () => void;
};
let pending: Promise<YoutubeAPI> | null = null;
/** One official script, only requested after the learner mounts a player. */
export function loadYouTubeAPI(): Promise<YoutubeAPI> {
  const w = window as YoutubeWindow;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    const previous = w.onYouTubeIframeAPIReady;
    const script = document.createElement("script");
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (w.onYouTubeIframeAPIReady === ready)
        w.onYouTubeIframeAPIReady = previous;
      script.onerror = null;
      if (error) {
        script.remove();
        pending = null;
        reject(error);
      } else resolve(w.YT!);
    };
    const ready = () => {
      try {
        previous?.();
      } finally {
        finish(w.YT?.Player ? undefined : new Error("YouTube API unavailable"));
      }
    };
    const timeout = window.setTimeout(
      () => finish(new Error("YouTube connection timed out")),
      12000,
    );
    w.onYouTubeIframeAPIReady = ready;
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.onerror = () => finish(new Error("YouTube API could not load"));
    document.head.appendChild(script);
  });
  return pending;
}
