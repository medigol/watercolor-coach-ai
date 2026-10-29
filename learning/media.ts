import type { MediaResource } from "./types";
import type { CaptionPreferences, VideoSegment } from "./videoTypes";
import { rubricMaximums } from "./videoTypes";
import { record } from "./validation";
import { items } from "./content";
import { skills, styles } from "./catalogue";
import { subjects, experiences } from "./types";

// Deliberately empty. Research records are NOT learner-facing resources.
// Publication requires direct content/segment evidence and explicit owner approval.
export const mediaResources: MediaResource[] = [];
export const defaultCaptions: CaptionPreferences = {
  mode: "default",
  language: "default",
};
const id = (v: unknown): v is string =>
  typeof v === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(v);
const text = (v: unknown): v is string =>
  typeof v === "string" && !!v.trim() && v.length <= 4000;
const texts = (v: unknown, min = 0): v is string[] =>
  Array.isArray(v) && v.length >= min && v.length <= 40 && v.every(text);
const refs = (v: unknown, known: readonly string[], min = 0): v is string[] =>
  texts(v, min) &&
  new Set(v).size === v.length &&
  v.every((x) => known.includes(x));
export function validDate(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v &&
    Date.parse(v) <= Date.now()
  );
}
const languages = [
  "en",
  "fa",
  "ja",
  "fr",
  "es",
  "de",
  "it",
  "pt",
  "zh",
  "ko",
  "ar",
  "hi",
  "ru",
  "tr",
  "nl",
  "pl",
  "uk",
  "sv",
  "id",
];
export function validLanguage(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[a-z]{2}(?:-[A-Z]{2})?$/.test(v) &&
    languages.includes(v.split("-")[0])
  );
}
export function safeHttps(v: unknown): v is string {
  if (typeof v !== "string" || v.length > 2000) return false;
  try {
    const u = new URL(v);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      u.hostname.includes(".") &&
      !/[<>\s]/.test(v)
    );
  } catch {
    return false;
  }
}
export function validCaptions(v: unknown): v is CaptionPreferences {
  return (
    record(v) &&
    Object.keys(v).length === 2 &&
    ["default", "prefer"].includes(String(v.mode)) &&
    ["default", "en", "fa"].includes(String(v.language))
  );
}
const statuses = [
  "discovered",
  "metadata-verified",
  "content-reviewed",
  "segment-verified",
  "embed-tested",
  "editorially-approved",
  "owner-approved",
  "retired",
];
export function validMedia(v: unknown): v is MediaResource {
  if (
    !record(v) ||
    !id(v.id) ||
    !text(v.videoId) ||
    !/^[\w-]{11}$/.test(v.videoId) ||
    v.url !== `https://www.youtube.com/watch?v=${v.videoId}` ||
    !text(v.channelUrl) ||
    !/^https:\/\/www\.youtube\.com\/(?:@[A-Za-z0-9_.-]{1,100}|channel\/UC[A-Za-z0-9_-]{22})$/.test(
      v.channelUrl,
    ) ||
    !text(v.creator) ||
    !text(v.title) ||
    !text(v.purpose) ||
    !validLanguage(v.language) ||
    !validDate(v.verifiedAt) ||
    v.verified !== true ||
    !(v.publishedAt === null || validDate(v.publishedAt)) ||
    (typeof v.publishedAt === "string" && v.publishedAt > v.verifiedAt) ||
    !Number.isInteger(v.durationSeconds) ||
    Number(v.durationSeconds) < 1 ||
    Number(v.durationSeconds) > 86400 ||
    !["foundation", "developing", "intermediate"].includes(
      String(v.difficulty),
    ) ||
    !["available", "unavailable", "unknown"].includes(String(v.availability)) ||
    ![true, false, null].includes(v.embeddable as never) ||
    typeof v.active !== "boolean" ||
    !(
      v.replacementId === null ||
      (id(v.replacementId) && v.replacementId !== v.id)
    ) ||
    !refs(
      v.lessonIds,
      items.map((i) => i.id),
      1,
    ) ||
    !refs(
      v.skillIds,
      skills.map((s) => s.id),
      1,
    ) ||
    !refs(
      v.styleTags,
      styles.map((s) => s.id),
    ) ||
    !refs(v.subjectTags, subjects) ||
    !texts(v.limitations)
  )
    return false;
  const audience = v.audience;
  if (
    !record(audience) ||
    !["unknown", "not-made-for-kids", "made-for-kids"].includes(
      String(audience.status),
    )
  )
    return false;
  if (audience.status === "unknown") {
    if (
      audience.checkedAt !== null ||
      audience.source !== null ||
      audience.reviewer !== null
    )
      return false;
  } else if (
    !validDate(audience.checkedAt) ||
    audience.checkedAt > String(v.verifiedAt) ||
    audience.source !== v.url ||
    !text(audience.reviewer)
  )
    return false;
  const c = v.captions,
    r = v.review;
  if (
    !record(c) ||
    !["unknown", "present", "absent"].includes(String(c.presence)) ||
    !Array.isArray(c.languages) ||
    !c.languages.every(validLanguage) ||
    new Set(c.languages).size !== c.languages.length ||
    !["unknown", "automatic", "human", "mixed"].includes(String(c.kind)) ||
    c.translation !== "unverified" ||
    !(c.checkedAt === null || validDate(c.checkedAt)) ||
    !(c.evidence === null || text(c.evidence))
  )
    return false;
  if (
    c.presence === "unknown" &&
    (c.languages.length ||
      c.kind !== "unknown" ||
      c.checkedAt !== null ||
      c.evidence !== null)
  )
    return false;
  if (
    c.presence !== "unknown" &&
    (!validDate(c.checkedAt) || !text(c.evidence))
  )
    return false;
  if (c.presence === "absent" && (c.languages.length || c.kind !== "unknown"))
    return false;
  if (c.kind !== "unknown" && (!c.languages.length || c.presence !== "present"))
    return false;
  if (
    !record(r) ||
    !statuses.includes(String(r.status)) ||
    !texts(r.criticalIssues) ||
    !Array.isArray(r.evidence) ||
    r.evidence.length > 60
  )
    return false;
  if (
    r.scores !== null &&
    (!record(r.scores) ||
      Object.keys(r.scores).length !== 8 ||
      Object.entries(rubricMaximums).some(
        ([k, max]) =>
          !Number.isInteger((r.scores as Record<string, unknown>)[k]) ||
          Number((r.scores as Record<string, unknown>)[k]) < 0 ||
          Number((r.scores as Record<string, unknown>)[k]) > max,
      ))
  )
    return false;
  if (
    !r.evidence.every(
      (e) =>
        record(e) &&
        [
          "metadata",
          "content",
          "segment",
          "embed",
          "editorial",
          "owner",
        ].includes(String(e.kind)) &&
        [
          "official-page",
          "direct-viewing",
          "live-player",
          "human-review",
        ].includes(String(e.method)) &&
        validDate(e.date) &&
        e.date <= String(v.verifiedAt) &&
        text(e.reviewer) &&
        safeHttps(e.source) &&
        text(e.note) &&
        (e.segmentId === undefined || id(e.segmentId)),
    )
  )
    return false;
  if (
    !Array.isArray(v.segments) ||
    !v.segments.length ||
    v.segments.length > 20 ||
    new Set(v.segments.map((s) => (record(s) ? s.id : null))).size !==
      v.segments.length
  )
    return false;
  if (!v.segments.every((s) => validSegment(s, v as unknown as MediaResource)))
    return false;
  const segs = v.segments as VideoSegment[];
  return !segs.some((a, n) =>
    segs
      .slice(n + 1)
      .some(
        (b) =>
          a.lessonId === b.lessonId &&
          a.stepId === b.stepId &&
          a.start < b.end &&
          b.start < a.end,
      ),
  );
}
function validSegment(v: unknown, r: MediaResource): v is VideoSegment {
  if (!record(v)) return false;
  const item = items.find((i) => i.id === v.lessonId);
  if (
    !item ||
    !r.lessonIds.includes(item.id) ||
    v.lessonVersion !== item.version ||
    !id(v.id) ||
    v.resourceId !== r.id ||
    !(v.stepId === undefined || item.steps.some((s) => s.id === v.stepId)) ||
    !refs(v.skillIds, r.skillIds, 1) ||
    !refs(v.levels, experiences, 1) ||
    !Number.isInteger(v.start) ||
    !Number.isInteger(v.end) ||
    Number(v.start) < 0 ||
    Number(v.end) <= Number(v.start) ||
    Number(v.end) > r.durationSeconds ||
    v.durationSeconds !== Number(v.end) - Number(v.start) ||
    ![
      "title",
      "objective",
      "approach",
      "watchFor",
      "misconception",
      "explanation",
    ].every((k) => text(v[k])) ||
    !texts(v.prompts, 2) ||
    !texts(v.limitations) ||
    !validDate(v.verifiedAt) ||
    v.verifiedAt > r.verifiedAt ||
    !["verified", "pending"].includes(String(v.verification))
  )
    return false;
  const p = v.practice;
  return (
    record(p) &&
    texts(p.materials, 1) &&
    text(p.action) &&
    text(p.variable) &&
    texts(p.constants, 1) &&
    texts(p.success, 1) &&
    text(p.reflection)
  );
}
export function publicationErrors(v: unknown): string[] {
  if (!validMedia(v))
    return ["Invalid media metadata, curriculum references or segment ranges"];
  const errors: string[] = [];
  if (v.audience.status !== "not-made-for-kids")
    errors.push(
      "Audience/Made for Kids review unresolved or excluded from this release",
    );
  if (!v.active || v.review.status === "retired")
    errors.push("Resource retired/inactive");
  if (v.review.status !== "owner-approved")
    errors.push("Explicit owner approval missing");
  if (v.availability !== "available" || v.embeddable === null)
    errors.push("Availability/playback route unverified");
  if (
    !v.review.scores ||
    Object.values(v.review.scores).reduce((a, b) => a + b, 0) < 85
  )
    errors.push("Editorial score below 85 or unscored");
  if (v.review.criticalIssues.length)
    errors.push("Critical editorial issue remains");
  for (const [kind, method] of [
    ["metadata", "official-page"],
    ["content", "direct-viewing"],
    ["editorial", "human-review"],
    ["owner", "human-review"],
  ])
    if (!v.review.evidence.some((e) => e.kind === kind && e.method === method))
      errors.push(`Missing ${kind} evidence`);
  if (
    v.embeddable &&
    !v.review.evidence.some(
      (e) => e.kind === "embed" && e.method === "live-player",
    )
  )
    errors.push("Live embed evidence missing");
  for (const s of v.segments)
    if (
      s.verification !== "verified" ||
      !v.review.evidence.some(
        (e) =>
          e.kind === "segment" &&
          e.method === "direct-viewing" &&
          e.segmentId === s.id,
      )
    )
      errors.push(`Segment ${s.id} not directly verified`);
  return errors;
}
export function catalogueErrors(resources: readonly unknown[]): string[] {
  const errors: string[] = [],
    ids = new Set(),
    videos = new Set(),
    segmentIds = new Set();
  for (const r of resources) {
    if (!record(r)) {
      errors.push("Invalid catalogue entry");
      continue;
    }
    if (ids.has(r.id) || videos.has(r.videoId))
      errors.push("Duplicate resource/video ID");
    ids.add(r.id);
    videos.add(r.videoId);
    errors.push(...publicationErrors(r));
    if (Array.isArray(r.segments))
      for (const s of r.segments)
        if (record(s)) {
          if (segmentIds.has(s.id)) errors.push("Duplicate segment ID");
          segmentIds.add(s.id);
        }
    if (
      typeof r.replacementId === "string" &&
      !resources.some((x) => record(x) && x.id === r.replacementId)
    )
      errors.push("Unknown replacement resource");
  }
  return errors;
}
export function videoUrls(
  resource: MediaResource,
  start = 0,
  end?: number,
  captions: CaptionPreferences = defaultCaptions,
  origin?: string,
) {
  if (
    !validMedia(resource) ||
    !validCaptions(captions) ||
    !Number.isInteger(start) ||
    start < 0 ||
    start >= resource.durationSeconds ||
    (end !== undefined &&
      (!Number.isInteger(end) ||
        end <= start ||
        end > resource.durationSeconds))
  )
    return null;
  const params = new URLSearchParams({
    start: String(start),
    controls: "1",
    playsinline: "1",
    autoplay: "0",
    enablejsapi: "1",
    hl: "en",
  });
  if (end !== undefined) params.set("end", String(end));
  if (origin !== undefined) {
    try {
      const u = new URL(origin);
      if (
        u.origin !== origin ||
        !(
          u.protocol === "https:" ||
          (u.protocol === "http:" &&
            ["localhost", "127.0.0.1"].includes(u.hostname))
        )
      )
        return null;
    } catch {
      return null;
    }
    params.set("origin", origin);
  }
  if (captions.mode === "prefer") {
    params.set("cc_load_policy", "1");
    if (captions.language !== "default")
      params.set("cc_lang_pref", captions.language);
  }
  return {
    full: resource.url,
    external: `${resource.url}&t=${start}s`,
    embed: `https://www.youtube-nocookie.com/embed/${resource.videoId}?${params}`,
  };
}
export function displayTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
/** Defense at the iframe boundary as well as at catalogue ingestion. */
export function validPlayerUrl(src: string, origin: string): boolean {
  try {
    const u = new URL(src),
      q = u.searchParams;
    const allowed = [
      "start",
      "end",
      "controls",
      "playsinline",
      "autoplay",
      "enablejsapi",
      "hl",
      "origin",
      "cc_load_policy",
      "cc_lang_pref",
    ];
    if (
      u.origin !== "https://www.youtube-nocookie.com" ||
      !/^\/embed\/[\w-]{11}$/.test(u.pathname) ||
      u.hash ||
      u.username ||
      u.password ||
      [...q.keys()].some(
        (k) => !allowed.includes(k) || q.getAll(k).length !== 1,
      )
    )
      return false;
    if (
      q.get("origin") !== origin ||
      q.get("controls") !== "1" ||
      q.get("enablejsapi") !== "1" ||
      q.get("autoplay") !== "0" ||
      q.get("playsinline") !== "1" ||
      q.get("hl") !== "en"
    )
      return false;
    const start = q.get("start"),
      end = q.get("end");
    if (
      !start ||
      !end ||
      !/^\d+$/.test(start) ||
      !/^\d+$/.test(end) ||
      Number(end) <= Number(start) ||
      Number(end) > 86400
    )
      return false;
    if (q.has("cc_load_policy") && q.get("cc_load_policy") !== "1")
      return false;
    return (
      !q.has("cc_lang_pref") ||
      (q.get("cc_load_policy") === "1" && validLanguage(q.get("cc_lang_pref")))
    );
  } catch {
    return false;
  }
}
