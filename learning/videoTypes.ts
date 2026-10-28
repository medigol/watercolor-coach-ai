import type { Difficulty, Experience, StyleId, Subject } from "./types";

export type EditorialStatus =
  | "discovered"
  | "metadata-verified"
  | "content-reviewed"
  | "segment-verified"
  | "embed-tested"
  | "editorially-approved"
  | "owner-approved"
  | "retired";
export type EvidenceKind =
  | "metadata"
  | "content"
  | "segment"
  | "embed"
  | "editorial"
  | "owner";
export interface VideoEvidence {
  kind: EvidenceKind;
  method: "official-page" | "direct-viewing" | "live-player" | "human-review";
  date: string;
  reviewer: string;
  source: string;
  note: string;
  segmentId?: string;
}
export const rubricMaximums = {
  technical: 25,
  alignment: 20,
  visibility: 15,
  explanation: 15,
  level: 10,
  pacing: 5,
  accessibility: 5,
  continuity: 5,
} as const;
export type VideoScores = { [K in keyof typeof rubricMaximums]: number };
export interface CaptionObservation {
  presence: "unknown" | "present" | "absent";
  languages: string[];
  kind: "unknown" | "automatic" | "human" | "mixed";
  translation: "unverified";
  checkedAt: string | null;
  evidence: string | null;
}
export interface CaptionPreferences {
  mode: "default" | "prefer";
  language: "default" | "en" | "fa";
}
export interface VideoSegment {
  id: string;
  resourceId: string;
  lessonId: string;
  lessonVersion: number;
  stepId?: string;
  skillIds: string[];
  start: number;
  end: number;
  durationSeconds: number;
  title: string;
  levels: Experience[];
  objective: string;
  approach: string;
  watchFor: string;
  prompts: string[];
  misconception: string;
  explanation: string;
  practice: {
    materials: string[];
    action: string;
    variable: string;
    constants: string[];
    success: string[];
    reflection: string;
  };
  verifiedAt: string;
  verification: "verified" | "pending";
  limitations: string[];
}
export interface MediaResource {
  id: string;
  videoId: string;
  url: string;
  channelUrl: string;
  creator: string;
  title: string;
  language: string;
  publishedAt: string | null;
  lessonIds: string[];
  skillIds: string[];
  subjectTags: Subject[];
  styleTags: StyleId[];
  difficulty: Difficulty;
  purpose: string;
  verifiedAt: string;
  verified: true;
  availability: "available" | "unavailable" | "unknown";
  embeddable: boolean | null;
  active: boolean;
  replacementId: string | null;
  durationSeconds: number;
  captions: CaptionObservation;
  review: {
    status: EditorialStatus;
    scores: VideoScores | null;
    criticalIssues: string[];
    evidence: VideoEvidence[];
  };
  limitations: string[];
  segments: VideoSegment[];
}
export type PlaybackState =
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "segment-ended"
  | "outside-segment"
  | "restricted"
  | "unavailable"
  | "error";
export interface SegmentCue {
  videoId: string;
  startSeconds: number;
  endSeconds: number;
}
export interface OfficialPlayer {
  cueVideoById(cue: SegmentCue): void;
  loadVideoById(cue: SegmentCue): void;
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}
