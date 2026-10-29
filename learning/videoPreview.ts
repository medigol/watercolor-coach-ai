import type { CaptionPreferences, PlaybackCue } from "./videoTypes";
import { validCaptions, validPlayerUrl } from "./media";
import { itemById } from "./content";
import { record } from "./validation";

export interface PreviewWindow {
  id: string;
  label: string;
  start: number;
  end?: number;
  source: "owner-proposal" | "owner-start-only" | "publisher-hint" | "conflicting-publisher-hint";
}
/** Intentionally distinct from MediaResource: cannot enter the approved catalogue. */
export interface PreviewCandidate {
  id: string;
  videoId: string;
  url: string;
  creator: string;
  researchTitle: string;
  ownerScreened: boolean;
  advancedOnly: boolean;
  related: { lessonId: string; stepId: string }[];
  windows: PreviewWindow[];
}
export function previewCatalogueErrors(candidates: readonly PreviewCandidate[]) {
  const errors: string[] = [], ids = new Set(), videos = new Set();
  const allowed = ["id", "videoId", "url", "creator", "researchTitle", "ownerScreened", "advancedOnly", "related", "windows"];
  for (const c of candidates) {
    if (Object.keys(c).some(k => !allowed.includes(k))) errors.push("Unexpected/private preview field");
    if (ids.has(c.id) || videos.has(c.videoId)) errors.push("Duplicate preview identity");
    ids.add(c.id); videos.add(c.videoId);
    if (!/^[a-z0-9-]{1,80}$/.test(c.id) || !/^[\w-]{11}$/.test(c.videoId) || c.url !== `https://www.youtube.com/watch?v=${c.videoId}`) errors.push("Unsafe preview URL/identity");
    if (!c.creator.trim() || !c.researchTitle.trim()) errors.push("Missing preview attribution");
    if (typeof c.ownerScreened !== "boolean" || typeof c.advancedOnly !== "boolean") errors.push("Invalid preview classification");
    for (const r of c.related) {
      if (Object.keys(r).some(k => !["lessonId", "stepId"].includes(k))) errors.push("Unexpected/private mapping field");
      if (!itemById(r.lessonId)?.steps.some(s => s.id === r.stepId)) errors.push("Unknown preview curriculum reference");
    }
    const windowIds = new Set();
    for (const w of c.windows) {
      if (Object.keys(w).some(k => !["id", "label", "start", "end", "source"].includes(k))) errors.push("Unexpected/private window field");
      if (windowIds.has(w.id)) errors.push("Duplicate preview window");
      windowIds.add(w.id);
      if (!Number.isInteger(w.start) || w.start < 0 || w.start > 86400 || (w.end !== undefined && (!Number.isInteger(w.end) || w.end <= w.start || w.end > 86400))) errors.push("Invalid proposed window");
      if (!["owner-proposal", "owner-start-only", "publisher-hint", "conflicting-publisher-hint"].includes(w.source)) errors.push("Invalid preview evidence label");
    }
  }
  return errors;
}
export function previewMatches(c: PreviewCandidate, lesson?: string, step?: string) {
  return !lesson || c.related.some(r => r.lessonId === lesson && (!step || r.stepId === step));
}
export function previewUrls(c: PreviewCandidate, windowId: string, captions: CaptionPreferences, origin?: string) {
  if (previewCatalogueErrors([c]).length || !validCaptions(captions)) return null;
  const window = windowId === "original" ? undefined : c.windows.find(w => w.id === windowId);
  if (windowId !== "original" && !window) return null;
  const cue: PlaybackCue = { videoId: c.videoId, startSeconds: window?.start ?? 0 };
  if (window?.end !== undefined) cue.endSeconds = window.end;
  const q = new URLSearchParams({ start: String(cue.startSeconds), controls: "1", playsinline: "1", autoplay: "0", enablejsapi: "1", hl: "en" });
  if (cue.endSeconds !== undefined) q.set("end", String(cue.endSeconds));
  if (origin) q.set("origin", origin);
  if (captions.mode === "prefer") {
    q.set("cc_load_policy", "1");
    if (captions.language !== "default") q.set("cc_lang_pref", captions.language);
  }
  const embed = `https://www.youtube-nocookie.com/embed/${c.videoId}?${q}`;
  if (origin) {
    try {
      const u = new URL(origin);
      if (u.origin !== origin || !(u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname)))) return null;
    } catch { return null; }
    if (!validPlayerUrl(embed, origin, cue.endSeconds === undefined)) return null;
  }
  return { full: c.url, external: `${c.url}&t=${cue.startSeconds}s`, embed, cue };
}

export interface PreviewReview {
  schema: 1;
  candidateId: string;
  playback: "not-tested" | "played" | "failed" | "restricted";
  observedStart: string;
  observedEnd: string;
  captions: string;
  correction: string;
}
export function blankPreviewReview(candidateId: string): PreviewReview {
  return { schema: 1, candidateId, playback: "not-tested", observedStart: "", observedEnd: "", captions: "", correction: "" };
}
export function decodePreviewReview(raw: string, candidateId: string): PreviewReview {
  if (raw.length > 20000) throw Error("Review data is too large. Existing data was preserved.");
  const x: unknown = JSON.parse(raw);
  if (!record(x) || x.schema !== 1 || x.candidateId !== candidateId || !["not-tested", "played", "failed", "restricted"].includes(String(x.playback)) ||
    ["observedStart", "observedEnd", "captions", "correction"].some(k => typeof x[k] !== "string" || String(x[k]).length > 4000) ||
    Object.keys(x).some(k => !Object.keys(blankPreviewReview(candidateId)).includes(k))) throw Error("Review data could not be read. Existing data was preserved.");
  return x as unknown as PreviewReview;
}
export function previewReviewKey(accountId: string, candidateId: string) {
  return `watercolor:video-preview:v1:${accountId}:${candidateId}`;
}
export function previewReviewExport(reviews: PreviewReview[], selectedWindow?: PreviewWindow) {
  return {
    schema: "watercolor-video-preview-review/v1",
    exportedAt: new Date().toISOString(),
    classification: "LOCAL_BROWSER_OBSERVATIONS_NOT_PUBLICATION_APPROVAL",
    productionApproved: false,
    ownerExactSegmentApproval: false,
    requestedWindow: selectedWindow ?? null,
    reviews,
  };
}
