import type {
  LearnerProgress,
  LearningItem,
  LessonProgress,
  ExerciseReflection,
} from "./types";
import { confidenceLevels } from "./types";
import { record, validProfile } from "./validation";
export const emptyProgress = (): LearnerProgress => ({
  schemaVersion: 1,
  mode: "structured",
  profile: null,
  draft: null,
  onboardingStep: 0,
  entries: {},
  currentItemId: null,
  updatedAt: new Date().toISOString(),
});
const safeId = (v: unknown): v is string =>
  typeof v === "string" && /^[a-z0-9][a-z0-9:_-]{0,79}$/.test(v);
const text = (v: unknown, max = 2000): v is string =>
  typeof v === "string" && v.length <= max;
const date = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 40 && Number.isFinite(Date.parse(v));
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) &&
  v.length <= 80 &&
  v.every(safeId) &&
  new Set(v).size === v.length;
export function validReflection(v: unknown): v is ExerciseReflection {
  return (
    record(v) &&
    text(v.text) &&
    !!v.text.trim() &&
    ["easy", "useful", "challenging"].includes(String(v.difficulty)) &&
    confidenceLevels.includes(v.confidence as never) &&
    date(v.recordedAt)
  );
}
function validEntry(v: unknown, id: string): v is LessonProgress {
  return (
    record(v) &&
    v.itemId === id &&
    Number.isInteger(v.contentVersion) &&
    Number(v.contentVersion) >= 1 &&
    safeId(v.stepId) &&
    record(v.checked) &&
    Object.keys(v.checked).length <= 80 &&
    Object.entries(v.checked).every(
      ([key, list]) => safeId(key) && strings(list),
    ) &&
    strings(v.completedSteps) &&
    record(v.notes) &&
    Object.keys(v.notes).length <= 80 &&
    Object.entries(v.notes).every(
      ([key, value]) => safeId(key) && text(value),
    ) &&
    (v.reflection === undefined || validReflection(v.reflection)) &&
    date(v.viewedAt) &&
    date(v.updatedAt)
  );
}
export function decodeProgress(raw: string | null): LearnerProgress {
  if (raw === null) return emptyProgress();
  if (raw.length > 1_000_000)
    throw Error("Stored learning data is too large. It has been preserved.");
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    throw Error(
      "Stored learning data could not be read. It has been preserved.",
    );
  }
  if (!record(v) || v.schemaVersion !== 1)
    throw Error(
      "This learning data uses an unsupported version. It has been preserved.",
    );
  if (
    !["structured", "personal"].includes(String(v.mode)) ||
    (v.profile !== null && !validProfile(v.profile)) ||
    (v.draft !== null && !validProfile(v.draft)) ||
    !Number.isInteger(v.onboardingStep) ||
    Number(v.onboardingStep) < 0 ||
    Number(v.onboardingStep) > 5 ||
    !record(v.entries) ||
    Object.keys(v.entries).length > 200 ||
    !Object.entries(v.entries).every(
      ([id, entry]) => safeId(id) && validEntry(entry, id),
    ) ||
    (v.currentItemId !== null && !safeId(v.currentItemId)) ||
    !date(v.updatedAt)
  )
    throw Error("Stored learning data is invalid. It has been preserved.");
  // Unknown content IDs and earlier content versions are retained. The UI
  // offers only current routes and never calls archived work corrupted.
  return v as unknown as LearnerProgress;
}
export function newEntry(item: LearningItem): LessonProgress {
  const now = new Date().toISOString();
  return {
    itemId: item.id,
    contentVersion: item.version,
    stepId: item.steps[0].id,
    checked: {},
    completedSteps: [],
    notes: {},
    viewedAt: now,
    updatedAt: now,
  };
}
export function resumeStep(item: LearningItem, entry?: LessonProgress): number {
  if (!entry || entry.contentVersion !== item.version) return 0;
  const index = item.steps.findIndex((s) => s.id === entry.stepId);
  return index >= 0
    ? index
    : Math.max(
        0,
        item.steps.findIndex((s) => !entry.completedSteps.includes(s.id)),
      );
}
export function completed(item: LearningItem, entry?: LessonProgress): boolean {
  return (
    !!entry &&
    entry.contentVersion === item.version &&
    item.steps.every((s) => entry.completedSteps.includes(s.id)) &&
    validReflection(entry.reflection)
  );
}
export function learningStatus(
  item: LearningItem,
  entry?: LessonProgress,
): string {
  if (completed(item, entry)) return "Completed · self-reported";
  if (!entry) return "Not started";
  if (entry.contentVersion !== item.version) return "Earlier version saved";
  return entry.completedSteps.some(
    (id) => item.steps.findIndex((s) => s.id === id) > 0,
  )
    ? "Practised · in progress"
    : "In progress";
}
export function editEntry(
  state: LearnerProgress,
  item: LearningItem,
  edit: (entry: LessonProgress) => void,
): LearnerProgress {
  const old = state.entries[item.id];
  if (old && old.contentVersion !== item.version)
    throw Error(
      "An earlier content version is preserved. Keep a backup before starting this version.",
    );
  const entry = old
    ? {
        ...old,
        checked: { ...old.checked },
        notes: { ...old.notes },
        completedSteps: [...old.completedSteps],
      }
    : newEntry(item);
  edit(entry);
  entry.updatedAt = new Date().toISOString();
  return {
    ...state,
    currentItemId: item.id,
    entries: { ...state.entries, [item.id]: entry },
    updatedAt: entry.updatedAt,
  };
}
export const checklistId = (stepId: string, index: number) =>
  `${stepId}:check:${index}`;
export function stepReady(
  item: LearningItem,
  index: number,
  entry?: LessonProgress,
): boolean {
  const step = item.steps[index];
  return (
    !!step &&
    step.checklist.every((_, i) =>
      entry?.checked[step.id]?.includes(checklistId(step.id, i)),
    ) &&
    (index !== item.steps.length - 1 ||
      (item.steps
        .slice(0, -1)
        .every((s) => entry?.completedSteps.includes(s.id)) &&
        !!entry?.notes["reflection-text"]?.trim() &&
        ["easy", "useful", "challenging"].includes(
          entry?.notes["reflection-difficulty"],
        ) &&
        confidenceLevels.includes(
          entry?.notes["reflection-confidence"] as never,
        )))
  );
}
export function finishStep(
  state: LearnerProgress,
  item: LearningItem,
  index: number,
): LearnerProgress {
  const old = state.entries[item.id];
  if (!stepReady(item, index, old))
    throw Error(
      "Complete this step's checklist and reflection before marking it complete.",
    );
  return editEntry(state, item, (entry) => {
    const id = item.steps[index].id;
    entry.completedSteps = [...new Set([...entry.completedSteps, id])];
    if (index === item.steps.length - 1)
      entry.reflection = {
        text: entry.notes["reflection-text"].trim(),
        difficulty: entry.notes[
          "reflection-difficulty"
        ] as ExerciseReflection["difficulty"],
        confidence: entry.notes[
          "reflection-confidence"
        ] as ExerciseReflection["confidence"],
        recordedAt: new Date().toISOString(),
      };
    entry.stepId = item.steps[Math.min(index + 1, item.steps.length - 1)].id;
  });
}
export interface LocalStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
/** One serialized writer per signed-in learner; never falls back to fake memory success. */
export class LearningStore {
  private raw: string | null = null;
  private loaded = false;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private storage: LocalStorageAdapter,
    readonly key: string,
  ) {}
  async load() {
    const raw = await this.storage.getItem(this.key);
    const value = decodeProgress(raw);
    this.raw = raw;
    this.loaded = true;
    return value;
  }
  save(value: LearnerProgress): Promise<void> {
    const raw = JSON.stringify(value);
    decodeProgress(raw);
    const write = async () => {
      if (!this.loaded)
        throw Error(
          "Learning data has not loaded. Your saved work was not overwritten.",
        );
      if ((await this.storage.getItem(this.key)) !== this.raw)
        throw Error(
          "Progress changed in another tab. Your current changes are not saved. Reload to read the other tab before continuing.",
        );
      await this.storage.setItem(this.key, raw);
      this.raw = raw;
    };
    const result = this.queue.then(write, write);
    this.queue = result.catch(() => {});
    return result;
  }
  async recoverWithBackup() {
    await this.queue;
    // Explicit user action only. Preserve unreadable/future-version data first.
    const raw = await this.storage.getItem(this.key);
    if (raw !== null)
      await this.storage.setItem(`${this.key}:backup:${Date.now()}`, raw);
    const fresh = emptyProgress();
    await this.storage.setItem(this.key, JSON.stringify(fresh));
    this.raw = JSON.stringify(fresh);
    this.loaded = true;
    return fresh;
  }
}
