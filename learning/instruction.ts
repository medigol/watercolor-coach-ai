import { itemById } from "./content";
import { previewCandidates } from "./videoPreviewCatalogue";
import { previewCatalogueErrors } from "./videoPreview";
import { waterInstruction, waterDiagnostics, instructionVideoLinks } from "./waterInstruction";
import type { InstructionalUnit, InstructionVideoLink, TroubleshootingEntry } from "./instructionTypes";
import { courseInstruction, courseDiagnostics, courseVideoLinks } from "./courseInstruction";
import { projectInstruction, projectDiagnostics, projectVideoLinks } from "./projectInstruction";
export { waterInstruction, waterDiagnostics, instructionVideoLinks };
export const instructionUnits = [...waterInstruction, ...courseInstruction, ...projectInstruction];
export const instructionDiagnostics = [...waterDiagnostics, ...courseDiagnostics, ...projectDiagnostics];
export const contextualVideoLinks = [...instructionVideoLinks, ...courseVideoLinks, ...projectVideoLinks];
export const unitsForStep = (lesson: string, step: string) => instructionUnits.filter(u => u.lessonId === lesson && u.stepId === step);
export const allInstructionErrors = () => instructionErrors(instructionUnits, contextualVideoLinks, instructionDiagnostics);
export function resolveInstructionVideo(link: InstructionVideoLink, unit: InstructionalUnit) {
  if (Object.keys(link).some(k => !["id","unitId","candidateId","windowId","suggestedRelevance","verify","scope","status","watchLabel"].includes(k))) return null;
  if (link.status !== "provisional-preview" || link.unitId !== unit.id || ["reflect", "intention"].includes(unit.stepId)) return null;
  const candidate = previewCandidates.find(c => c.id === link.candidateId);
  if (!candidate || previewCatalogueErrors([candidate]).length || !candidate.related.some(r => r.lessonId === unit.lessonId && r.stepId === unit.stepId)) return null;
  const window = candidate.windows.find(w => w.id === link.windowId);
  if (link.windowId !== "original" && !window) return null;
  if (window && (window.source === "conflicting-publisher-hint" || candidate.windows.some(w => w.source === "conflicting-publisher-hint" && w.start === window.start))) return null;
  if ((link.scope === "chapter-hint" && window?.source !== "publisher-hint") ||
      (link.scope === "start-only" && (window?.source !== "owner-start-only" || window.end !== undefined)) ||
      (link.scope === "long-proposal" && window?.source !== "owner-proposal") ||
      (link.scope === "original" && link.windowId !== "original") ||
      !["long-proposal","chapter-hint","start-only","original"].includes(link.scope)) return null;
  return { candidate, window };
}
export function instructionErrors(units: readonly InstructionalUnit[] = waterInstruction, links: readonly InstructionVideoLink[] = instructionVideoLinks, diagnostics: readonly TroubleshootingEntry[] = waterDiagnostics): string[] {
  const errors: string[] = [], seen = new Set<string>(), seenLinks = new Set<string>(), seenDiag = new Set<string>(), positions = new Map<string, number>();
  const text = (v: unknown) => typeof v === "string" && !!v.trim();
  const texts = (v: unknown) => Array.isArray(v) && v.length > 0 && v.every(text);
  for (const d of diagnostics) {
    if (seenDiag.has(d.id)) errors.push(`Duplicate diagnostic: ${d.id}`); seenDiag.add(d.id);
    if (![d.id,d.symptom,d.check,d.correction,d.stop,d.normalVariation].every(text) || !texts(d.causes)) errors.push(`Incomplete diagnostic: ${d.id}`);
  }
  for (const u of units) {
    if (!/^[a-z][a-z0-9-]+$/.test(u.id) || seen.has(u.id)) errors.push(`Invalid/duplicate unit: ${u.id}`); seen.add(u.id);
    const item = itemById(u.lessonId), n = item?.steps.findIndex(s => s.id === u.stepId) ?? -1;
    if (n < 0) errors.push(`Unknown lesson/step: ${u.id}`);
    if (n < (positions.get(u.lessonId) ?? -1)) errors.push(`Contradictory step order: ${u.id}`); positions.set(u.lessonId,n);
    if (![u.title,u.outcome,u.transition,u.setup,u.concept,u.observe,u.why,u.tip,u.beginnerTerm,u.advanced,u.drying].every(text) || !texts(u.actions)) errors.push(`Incomplete teaching: ${u.id}`);
    if (!/^[a-z][a-z0-9-]+$/.test(u.topic)) errors.push(`Unknown topic: ${u.id}`);
    if (u.illustration && !["variables","brush","wash","moisture","water","values","edges","drawing","landscape"].includes(u.illustration)) errors.push(`Unknown illustration: ${u.id}`);
    if (!u.exercise || ![u.exercise.action,u.exercise.variable,u.exercise.transfer].every(text) || !texts(u.exercise.constants) || !texts(u.exercise.success)) errors.push(`Incomplete experiment: ${u.id}`);
    if (![u.minutes?.reading,u.minutes?.practice].every(n => Number.isInteger(n) && n > 0)) errors.push(`Invalid active time: ${u.id}`);
    if (u.editorial?.status !== "self-reviewed-awaiting-owner" || u.editorial?.version !== 1 || Object.keys(u.editorial).some(k => !["status","version"].includes(k))) errors.push(`Unsupported editorial claim: ${u.id}`);
    if (u.diagnosticIds.some(id => !diagnostics.some(d => d.id === id))) errors.push(`Orphan diagnostic: ${u.id}`);
  }
  for (const l of links) {
    if (seenLinks.has(l.id)) errors.push(`Duplicate video link: ${l.id}`); seenLinks.add(l.id);
    const u = units.find(u => u.id === l.unitId);
    if (!u || !resolveInstructionVideo(l,u)) errors.push(`Unsupported preview link: ${l.id}`);
    if (!text(l.watchLabel) || !text(l.suggestedRelevance) || !text(l.verify)) errors.push(`Missing preview limitation: ${l.id}`);
  }
  for (const lesson of new Set(units.map(u => u.lessonId))) {
    const item = itemById(lesson); if (!item) continue;
    for (const step of item.steps) {
      const group = units.filter(u => u.lessonId === lesson && u.stepId === step.id);
      if (!group.length) errors.push(`Uncovered canonical step: ${lesson}:${step.id}`);
      else if (group.reduce((n,u) => n+u.minutes.reading+u.minutes.practice,0) !== step.minutes) errors.push(`Active time mismatch: ${lesson}:${step.id}`);
    }
  }
  return errors;
}
