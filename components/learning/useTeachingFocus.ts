import { useEffect, useState } from "react";
import type { InstructionalUnit } from "../../learning/instructionTypes";
import { readTeachingFocus, teachingFocusKey, writeTeachingFocus } from "../../learning/teachingFocus";

function tabStorage() {
  try { return typeof window === "undefined" ? null : window.sessionStorage; }
  catch { return null; }
}

/** Only an explicit selection is stored. Never restore player intent or write progress. */
export function useTeachingFocus(account: string | undefined, lesson: string, step: string, units: InstructionalUnit[]) {
  const key = teachingFocusKey(account, lesson, step);
  const [position, setPosition] = useState<{key: string | null; id?: string}>({key:null});
  const allowed = units.map(u => u.id);
  // Depend on IDs, not a newly allocated units array on each progress render.
  const allowedKey = allowed.join("|");
  useEffect(() => {
    setPosition({key, id:readTeachingFocus(tabStorage(), key, allowedKey.split("|"))});
  }, [key, allowedKey]);
  const focus = units.find(u => position.key === key && position.id === u.id) ?? units[0];
  function select(id: string) {
    if (!allowed.includes(id)) return;
    setPosition({key,id});
    writeTeachingFocus(tabStorage(),key,allowed,id);
  }
  return { focus, select };
}
