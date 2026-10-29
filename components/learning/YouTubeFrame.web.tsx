import { useEffect, useRef } from "react";
import type { YouTubeFrameProps } from "./YouTubeFrame";
import { SegmentPlayback, type PlayerNotice } from "../../learning/videoPlayer";
import { validPlayerUrl } from "../../learning/media";
import { loadYouTubeAPI } from "./youtubeApi.web";
let releaseActive: (() => void) | null = null;
export default function YouTubeFrame({
  src,
  title,
  cue,
  controls,
  onState,
  allowOriginal = false,
}: YouTubeFrameProps) {
  const root = useRef<HTMLDivElement>(null),
    controller = useRef<SegmentPlayback | null>(null);
  const latest = useRef({ cue, onState });
  latest.current = { cue, onState };
  // src changes only for a different video or explicitly applied caption settings.
  useEffect(() => {
    releaseActive?.();
    let alive = true,
      disposed = false,
      instance: import("../../learning/videoTypes").OfficialPlayer | null =
        null;
    let interval: ReturnType<typeof setInterval> | undefined;
    let readyTimeout: ReturnType<typeof setTimeout> | undefined;
    const notify = (v: PlayerNotice) => {
      if (alive) latest.current.onState(v);
    };
    const pause = () => {
      try {
        controller.current?.pause();
      } catch {
        /* API may already have removed its frame. */
      }
    };
    const hidden = () => {
      if (document.hidden) pause();
    };
    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      alive = false;
      clearInterval(interval);
      clearTimeout(readyTimeout);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", pause);
      controls.current = null;
      try {
        if (controller.current) controller.current.dispose();
        else instance?.destroy();
      } catch {
        /* Navigation must not be blocked by provider cleanup. */
      }
      controller.current = null;
      root.current?.replaceChildren();
      if (releaseActive === cleanup) releaseActive = null;
    };
    releaseActive = cleanup;
    if (!validPlayerUrl(src, window.location.origin, allowOriginal)) {
      notify({
        state: "error",
        message:
          "The demonstration URL failed the safety check. Continue with the exercise.",
      });
      return cleanup;
    }
    const iframe = document.createElement("iframe");
    iframe.title = title;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.style.cssText =
      "display:block;border:0;width:100%;height:100%;min-width:200px;min-height:200px";
    iframe.src = src;
    root.current?.appendChild(iframe);
    notify({
      state: "loading",
      message: "Connecting to the official YouTube player…",
    });
    loadYouTubeAPI()
      .then((api) => {
        if (!alive) return;
        instance = new api.Player(iframe, {
          events: {
            onReady: () => {
              if (!alive || !instance) return;
              clearTimeout(readyTimeout);
              controller.current = new SegmentPlayback(
                instance,
                latest.current.cue,
                notify,
              );
              controls.current = controller.current;
              controller.current.select(latest.current.cue);
              interval = setInterval(() => {
                try {
                  controller.current?.poll();
                } catch {
                  notify({
                    state: "error",
                    message:
                      "The player connection was lost. Your lesson is still available.",
                  });
                  pause();
                }
              }, 500);
            },
            onStateChange: (e) => controller.current?.event(e.data),
            onError: (e) => {
              if (controller.current) controller.current.error(e.data);
              else {
                notify(importFailure(e.data));
              }
            },
          },
        });
        readyTimeout = setTimeout(() => {
          if (alive && !controller.current) {
            notify({
              state: "error",
              message:
                "YouTube did not become ready. Open the original video or continue with the exercise.",
            });
            try {
              instance?.destroy();
            } catch {}
          }
        }, 15000);
      })
      .catch(() =>
        notify({
          state: "error",
          message:
            "YouTube could not connect. Open the original video or continue with the exercise.",
        }),
      );
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", pause);
    return () => {
      clearTimeout(readyTimeout);
      cleanup();
    };
  }, [src, allowOriginal]);
  useEffect(() => {
    controller.current?.select(cue);
  }, [cue.videoId, cue.startSeconds, cue.endSeconds]);
  return (
    <div
      ref={root}
      data-testid="official-youtube-player"
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        minWidth: 200,
        minHeight: 200,
      }}
    />
  );
}
import { playerFailure as importFailure } from "../../learning/videoPlayer";
