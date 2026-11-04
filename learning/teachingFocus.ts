/** Optional tab-session reading position, never part of learner progress. */
export interface FocusStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function teachingFocusKey(account: string | undefined, lesson: string, step: string): string | null {
  if (!account || !lesson || !step) return null;
  return `watercolor:teaching-focus:v1:${[account, lesson, step].map(encodeURIComponent).join(":")}`;
}

export function readTeachingFocus(storage: FocusStorage | null, key: string | null, allowed: readonly string[]): string | undefined {
  try {
    const id = key ? storage?.getItem(key) : null;
    return id && allowed.includes(id) ? id : undefined;
  } catch {
    // Blocked session storage must never obstruct teaching or progress recovery.
    return undefined;
  }
}

export function writeTeachingFocus(storage: FocusStorage | null, key: string | null, allowed: readonly string[], id: string): void {
  if (!key || !allowed.includes(id)) return;
  try { storage?.setItem(key, id); } catch { /* In-memory reading navigation still works. */ }
}
