import type { LessonStep } from "./types";
/** Additive teaching, independent of persisted checklist/completion identity. */
/** Stable editorial topic key; canonical lesson/step references are validated separately. */
export type InstructionTopic = string;
export type InstructionVisual = "variables" | "brush" | "wash" | "moisture" | LessonStep["visual"];
export interface TroubleshootingEntry {
  id: string; symptom: string; causes: string[]; check: string;
  correction: string; stop: string; normalVariation: string;
}
export interface InstructionalUnit {
  id: string; lessonId: string; stepId: string; title: string;
  topic: InstructionTopic; outcome: string; transition: string;
  setup: string; concept: string; actions: string[]; observe: string;
  why: string; tip: string; beginnerTerm: string; advanced: string;
  exercise: { action: string; variable: string; constants: string[]; success: string[]; transfer: string };
  minutes: { reading: number; practice: number }; drying: string;
  illustration?: InstructionVisual; diagnosticIds: string[];
  editorial: { status: "self-reviewed-awaiting-owner"; version: 1 };
}
/** Preview references CANNOT satisfy MediaResource or its publication gate. */
export interface InstructionVideoLink {
  id: string; unitId: string; candidateId: string; windowId: string;
  watchLabel: string; suggestedRelevance: string; verify: string; scope: "long-proposal" | "chapter-hint" | "start-only" | "original";
  status: "provisional-preview";
}
