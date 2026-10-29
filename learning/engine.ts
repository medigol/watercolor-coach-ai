import { goalLabels, styleById, subjectLabels } from "./catalogue";
import { items, lessons, itemById, project } from "./content";
import { completed } from "./progress";
import type { LearnerProgress, LearningPath, LearningProfile } from "./types";
export function sessionPlan(id: string, minutes: number): string {
  const item = itemById(id)!;
  const total = item.instructionMinutes + item.practiceMinutes;
  const longest = Math.max(...item.steps.map((s) => s.minutes));
  if (longest > minutes)
    return `${total} active minutes total, including a ${longest}-minute activity. Use the authored short comparison or allow a longer session; do not rush a drying passage.`;
  let sessions = 1,
    used = 0;
  for (const step of item.steps) {
    if (used + step.minutes > minutes) {
      sessions++;
      used = 0;
    }
    used += step.minutes;
  }
  return total <= minutes
    ? `${total} active minutes, plus any drying time.`
    : `${sessions} short sessions of up to ${minutes} active minutes (${total} active minutes total). Pause at step boundaries; drying time is additional.`;
}
export function application(profile: LearningProfile, id: string): string {
  const subject = subjectLabels[profile.subject].toLowerCase();
  if (id === "water-brush")
    return `Apply the same dilution tests to a small ${subject} colour passage; keep the pigment constant.`;
  if (id === "three-values")
    return `Use your own ${subject} subject for the two thumbnails. Keep framing constant.`;
  if (id === "edge-families")
    return profile.primaryStyle === "botanical"
      ? "Use a leaf pair: compare a precise silhouette and a quieter internal transition."
      : profile.primaryStyle === "expressive"
        ? "Use an abstract shape: compare a decisive mark and a merging interval without requiring realism."
        : `Compare one selected boundary in a ${subject} study. ${styleById(profile.primaryStyle).exercise}`;
  if (id === "observed-structure")
    return profile.primaryStyle === "botanical"
      ? "Compare a leaf's overall proportions and negative spaces; use the box for the separate perspective test."
      : `Use a simple ${subject} form where practical, or the box provided. Intentional distortion remains an option.`;
  return `The guided subject is a landscape. Its value/edge principle can later transfer to ${subject}; it is not a custom-generated project.`;
}
export function makePath(state: LearnerProgress): LearningPath {
  const p = state.profile;
  const personal = state.mode === "personal" && !!p;
  const finished = new Set(
    items
      .filter((i) => completed(i, state.entries[i.id]))
      .flatMap((i) => i.skillIds),
  );
  const comfortable = (id: string) =>
    finished.has(id) ||
    (personal && ["comfortable", "confident"].includes(p.diagnostic[id] ?? ""));
  const revisionIds = items
    .filter(
      (i) => state.entries[i.id]?.reflection?.difficulty === "challenging",
    )
    .map((i) => i.id);
  const order: string[] = [];
  const reasons = new Map<string, string>();
  function add(id: string, reason: string, visiting = new Set<string>()) {
    if (order.includes(id) || visiting.has(id)) return;
    const item = itemById(id);
    if (!item) return;
    const next = new Set(visiting).add(id);
    for (const skill of item.prerequisiteSkillIds) {
      if (!comfortable(skill)) {
        const teacher = lessons.find((l) => l.skillIds.includes(skill));
        if (teacher && (!personal || p.experience !== "advanced"))
          add(
            teacher.id,
            `Supports ${item.title.toLowerCase()}: practise ${skill.replace(/-/g, " ")} first.`,
            next,
          );
      }
    }
    order.push(id);
    reasons.set(id, reason);
  }
  if (!personal) {
    add(
      "water-brush",
      "Begin with repeatable water decisions; no questionnaire needed.",
    );
    add(
      "three-values",
      "Plan large light/dark relationships before combining skills.",
    );
    add(
      "edge-families",
      "Build on water control to compare separation and connection.",
    );
  } else {
    for (const id of revisionIds)
      add(
        id,
        "You described this exercise as challenging. Revisit its controlled comparison before adding complexity.",
      );
    const urban =
      p.goal === "urban" || p.subject === "urban" || p.primaryStyle === "urban";
    const observation =
      urban || p.primaryStyle === "botanical" || p.goal === "realism";
    const weak = (id: string) =>
      ["new", "developing"].includes(p.diagnostic[id] ?? "");
    if (observation && (!comfortable("perspective") || weak("drawing")))
      add(
        "observed-structure",
        `Your ${urban ? "urban" : "observational"} interest benefits from comparing shapes${weak("perspective") ? "; you marked perspective for practice" : " and planes"}.`,
      );
    if (
      p.experience === "beginner" ||
      weak("water-control") ||
      (p.experience === "developing" && !comfortable("water-control"))
    )
      add(
        "water-brush",
        `Build repeatable water decisions for ${goalLabels[p.goal].toLowerCase()}.`,
      );
    const priorities =
      p.primaryStyle === "expressive" || p.primaryStyle === "botanical"
        ? ["edge-families", "three-values"]
        : ["three-values", "edge-families"];
    for (const id of priorities) {
      const skill = id === "three-values" ? "values" : "edges";
      if (p.experience !== "advanced" || weak(skill)) {
        if (!comfortable(skill))
          add(
            id,
            `${styleById(p.primaryStyle).title} emphasises ${skill === "values" ? "large tonal relationships" : "chosen boundaries"}${weak(skill) ? "; your self-report suggests practice" : ""}.`,
          );
      }
    }
    for (const style of p.secondaryStyles)
      if (style === "urban" || style === "botanical")
        add(
          "observed-structure",
          `An observation study also supports your secondary ${styleById(style).title.toLowerCase()} interest.`,
        );
  }
  add(
    project.id,
    personal
      ? "Combine value and edge choices in a small resumable study; choose refreshers when useful."
      : "Combine the foundational studies in one small painting.",
  );
  // Keep completed work in the path and available in Progress, never erase it.
  const recommendations = order.map((itemId) => {
    const i = itemById(itemId)!;
    const refresher =
      completed(i, state.entries[itemId]) ||
      (personal && p.experience === "advanced" && i.kind === "lesson");
    return {
      itemId,
      reason: reasons.get(itemId)!,
      refresher,
      prerequisiteNotes: i.prerequisiteSkillIds
        .filter((id) => !comfortable(id))
        .map(
          (id) =>
            `${id.replace(/-/g, " ")}: available as a refresher; readiness has not been independently assessed.`,
        ),
      application: personal
        ? application(p, itemId)
        : "Follow the supplied study, then try your own subject without changing its controlled variable.",
      sessionPlan: sessionPlan(itemId, p?.minutes ?? 15),
    };
  });
  return {
    mode: personal ? "personal" : "structured",
    title: personal ? goalLabels[p.goal] : "The foundation pathway",
    recommendations,
    revisionIds,
    refresherIds: lessons
      .filter(
        (i) =>
          (personal && p.experience === "advanced") ||
          completed(i, state.entries[i.id]) ||
          i.skillIds.every(comfortable),
      )
      .map((i) => i.id),
    weeklySuggestion:
      personal && p.weeklySessions
        ? `Plan ${p.weeklySessions} session${p.weeklySessions === 1 ? "" : "s"} of up to ${p.minutes} minutes. Review dry results at the next session; there is no streak to maintain.`
        : "Try two short sessions and a dry-result comparison this week; adapt this to your schedule.",
    limitations: [
      "Recommendations use your preferences and self-report, not an assessment of artistic ability.",
      "Four lessons and one project are available. The remaining curriculum is an honest outline, not an unlocked course.",
      ...(personal && p.format === "video"
        ? [
            "No verified video is assigned yet. The original visual explanation and exercise remain complete.",
          ]
        : []),
    ],
  };
}
