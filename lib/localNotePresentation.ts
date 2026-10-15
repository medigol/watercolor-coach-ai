import type { CoachingOverlay } from "./overlays";
import { legendGroup } from "./overlayDrawing";
import { studyText } from "./coachingPresentation";
import {
  effectiveClassification,
  usefulEvidence,
} from "../shared/visualMetadata";

/** Keep uncertain observations useful without turning an unsupported claim into a fault. */
export function presentedLocalNote(
  note: CoachingOverlay,
  study = false,
): CoachingOverlay {
  const classification = effectiveClassification(note, study);
  const hasEvidence = usefulEvidence(note.evidence);
  const alreadyOptional =
    /^(?:if useful|optional|(?:in|for|on) (?:a|the|your) (?:separate|next|new|small) study|you could|you might)\b/i.test(
      note.shortInstruction.trim(),
    );
  const unsupportedCorrection =
    !hasEvidence &&
    !alreadyOptional &&
    note.classification !== "strength" &&
    note.classification !== "stylistic_alternative";
  const gentle =
    study ||
    unsupportedCorrection ||
    classification === "stylistic_alternative" ||
    classification === "study_experiment";
  if (!gentle) return note;
  return {
    ...note,
    evidence: study ? studyText(note.evidence, "") : note.evidence,
    label: studyText(
      note.label,
      `${legendGroup(note) === "Simplify" ? "Shape" : legendGroup(note)} study`,
    ),
    shortInstruction: unsupportedCorrection
      ? "If useful, compare this passage with the wider painting in a separate study."
      : studyText(
          note.shortInstruction,
          "Observe this passage within the wider painting.",
        ),
    reason: unsupportedCorrection
      ? "Test how it relates to neighbouring shapes, values, and edges."
      : studyText(
          note.reason,
          "Compare its relationship with neighbouring shapes, values, and edges.",
        ),
    action: studyText(
      note.action,
      "If useful, test a modest variation on a separate study sheet.",
    ),
  };
}
