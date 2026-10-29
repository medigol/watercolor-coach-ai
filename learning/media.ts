import type { MediaResource } from "./types";
import { record } from "./validation";
import { items } from "./content";
import { skills, styles } from "./catalogue";
import { subjects } from "./types";
// Intentionally empty: current external documentation/video verification was
// blocked in this environment. No guessed IDs, timestamps or fake records.
export const mediaResources: MediaResource[] = [];
export function validMedia(value: unknown): value is MediaResource {
  if (
    !record(value) ||
    value.verified !== true ||
    typeof value.id !== "string" ||
    !/^[a-z0-9-]{1,80}$/.test(value.id) ||
    typeof value.videoId !== "string" ||
    !/^[A-Za-z0-9_-]{11}$/.test(value.videoId) ||
    value.url !== `https://www.youtube.com/watch?v=${value.videoId}` ||
    typeof value.creator !== "string" ||
    !value.creator.trim() ||
    typeof value.title !== "string" ||
    !value.title.trim() ||
    typeof value.purpose !== "string" ||
    !value.purpose.trim() ||
    typeof value.language !== "string" ||
    !value.language.trim() ||
    !["foundation", "developing", "intermediate"].includes(
      String(value.difficulty),
    ) ||
    typeof value.verifiedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.verifiedAt) ||
    !Number.isFinite(Date.parse(value.verifiedAt)) ||
    Date.parse(value.verifiedAt) > Date.now() ||
    !Number.isInteger(value.durationSeconds) ||
    Number(value.durationSeconds) <= 0 ||
    !["available", "unavailable", "unknown"].includes(
      String(value.availability),
    ) ||
    !(
      value.embeddable === true ||
      value.embeddable === false ||
      value.embeddable === null
    ) ||
    !Array.isArray(value.segments) ||
    value.segments.length > 20
  )
    return false;
  if (
    !Array.isArray(value.lessonIds) ||
    !value.lessonIds.length ||
    !value.lessonIds.every((id) => items.some((i) => i.id === id)) ||
    !Array.isArray(value.skillIds) ||
    !value.skillIds.every((id) => skills.some((s) => s.id === id)) ||
    !Array.isArray(value.styleTags) ||
    !value.styleTags.every((id) => styles.some((s) => s.id === id)) ||
    !Array.isArray(value.subjectTags) ||
    !value.subjectTags.every((id) => subjects.includes(id as never))
  )
    return false;
  return value.segments.every(
    (s) =>
      record(s) &&
      typeof s.title === "string" &&
      typeof s.watchFor === "string" &&
      !!s.watchFor.trim() &&
      Number.isInteger(s.start) &&
      Number.isInteger(s.end) &&
      Number(s.start) >= 0 &&
      Number(s.end) > Number(s.start) &&
      Number(s.end) <= Number(value.durationSeconds),
  );
}
export function videoUrls(resource: MediaResource, start = 0) {
  if (
    !validMedia(resource) ||
    !Number.isInteger(start) ||
    start < 0 ||
    start >= resource.durationSeconds
  )
    return null;
  return {
    external: `${resource.url}&t=${start}s`,
    embed: `https://www.youtube-nocookie.com/embed/${resource.videoId}?start=${start}&controls=1&playsinline=1&autoplay=0`,
  };
}
