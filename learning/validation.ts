import { diagnosticSkills, styles, skills, modules } from "./catalogue";
import { items } from "./content";
import {
  confidenceLevels,
  experiences,
  goals,
  subjects,
  type LearningProfile,
} from "./types";
export const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const oneOf = (v: unknown, list: readonly unknown[]) => list.includes(v);
export function validProfile(value: unknown): value is LearningProfile {
  if (!record(value)) return false;
  const allowed = [
    "experience",
    "goal",
    "subject",
    "primaryStyle",
    "secondaryStyles",
    "minutes",
    "diagnostic",
    "format",
    "weeklySessions",
  ];
  return (
    Object.keys(value).every((k) => allowed.includes(k)) &&
    oneOf(value.experience, experiences) &&
    oneOf(value.goal, goals) &&
    oneOf(value.subject, subjects) &&
    styles.some((s) => s.id === value.primaryStyle) &&
    Array.isArray(value.secondaryStyles) &&
    value.secondaryStyles.length <= 3 &&
    new Set(value.secondaryStyles).size === value.secondaryStyles.length &&
    value.secondaryStyles.every(
      (id) => id !== value.primaryStyle && styles.some((s) => s.id === id),
    ) &&
    oneOf(value.minutes, [10, 15, 30, 45, 60]) &&
    oneOf(value.format, ["mixed", "reading", "video"]) &&
    (value.weeklySessions === undefined ||
      (Number.isInteger(value.weeklySessions) &&
        Number(value.weeklySessions) >= 1 &&
        Number(value.weeklySessions) <= 7)) &&
    record(value.diagnostic) &&
    Object.entries(value.diagnostic).every(
      ([id, level]) =>
        diagnosticSkills.includes(id) && oneOf(level, confidenceLevels),
    )
  );
}
export function prerequisiteErrors(
  nodes: { id: string; prerequisites: string[] }[],
): string[] {
  const errors: string[] = [],
    ids = new Set(nodes.map((n) => n.id));
  if (ids.size !== nodes.length) errors.push("Duplicate skill IDs");
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) {
      errors.push(`Circular prerequisite: ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const ref of nodes.find((n) => n.id === id)?.prerequisites ?? []) {
      if (!ids.has(ref)) errors.push(`Missing prerequisite: ${ref}`);
      else visit(ref);
    }
    visiting.delete(id);
    visited.add(id);
  };
  nodes.forEach((n) => visit(n.id));
  return errors;
}
export function curriculumErrors(): string[] {
  const errors = prerequisiteErrors(skills);
  for (const [kind, list] of [
    ["module", modules],
    ["item", items],
    ["style", styles],
  ] as const)
    if (new Set(list.map((x) => x.id)).size !== list.length)
      errors.push(`Duplicate ${kind} IDs`);
  const knownSkills = new Set(skills.map((s) => s.id));
  for (const s of skills)
    if (!modules.some((m) => m.id === s.moduleId))
      errors.push(`Missing skill module: ${s.id}`);
  for (const m of modules) {
    if (!m.topics.length || !m.description || m.version < 1)
      errors.push(`Incomplete module: ${m.id}`);
    if (m.skillIds.some((id) => !knownSkills.has(id)))
      errors.push(`Unknown module skill: ${m.id}`);
    if (
      m.lessonIds.some(
        (id) => !items.some((i) => i.id === id && i.moduleId === m.id),
      )
    )
      errors.push(`Unavailable lesson: ${m.id}`);
  }
  for (const i of items) {
    if (!modules.some((m) => m.id === i.moduleId && m.lessonIds.includes(i.id)))
      errors.push(`Missing item module: ${i.id}`);
    if (
      [...i.skillIds, ...i.prerequisiteSkillIds].some(
        (id) => !knownSkills.has(id),
      )
    )
      errors.push(`Unknown item skill: ${i.id}`);
    if (
      !i.why ||
      !i.objectives.length ||
      !i.materials.length ||
      !i.reflectionPrompt ||
      i.steps.length < 3 ||
      !i.exercise.success.length ||
      !i.exercise.constants.length ||
      !i.exercise.variable ||
      !i.exercise.recovery ||
      !i.exercise.extension
    )
      errors.push(`Incomplete teaching: ${i.id}`);
    if (new Set(i.steps.map((s) => s.id)).size !== i.steps.length)
      errors.push(`Duplicate steps: ${i.id}`);
    if (
      i.steps.some(
        (s) =>
          !s.explanation ||
          !s.actions.length ||
          !s.checklist.length ||
          !s.observe ||
          !s.pitfall ||
          s.minutes < 1 ||
          s.minutes > 15,
      )
    )
      errors.push(`Incomplete step: ${i.id}`);
    if (
      i.steps.reduce((sum, s) => sum + s.minutes, 0) !==
      i.instructionMinutes + i.practiceMinutes
    )
      errors.push(`Time mismatch: ${i.id}`);
  }
  for (const s of styles)
    if (
      s.skillIds.some((id) => !knownSkills.has(id)) ||
      s.related.some((id) => !styles.some((other) => other.id === id))
    )
      errors.push(`Invalid style references: ${s.id}`);
  return errors;
}
