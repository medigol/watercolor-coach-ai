// Shared deterministic presentation rules. No network, storage or model calls.
export interface CoachingDecision {
  primaryGoal: string;
  primarySubjectOrArea: string;
  areasToEmphasize: string[];
  areasToQuiet: string[];
  currentPaintingAction: string | null;
  nextStudyAction: string | null;
  supportingObservations: string[];
  compositionImplication: string | null;
  colourImplication: string | null;
  techniqueImplication: string | null;
}

const fields = [
  "primaryGoal",
  "primarySubjectOrArea",
  "areasToEmphasize",
  "areasToQuiet",
  "currentPaintingAction",
  "nextStudyAction",
  "supportingObservations",
  "compositionImplication",
  "colourImplication",
  "techniqueImplication",
];
const text = (value: unknown, limit = 350): value is string =>
  typeof value === "string" && !!value.trim() && value.length <= limit;
const normalized = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
const target = (value: string) =>
  normalized(value).replace(/^(?:the|a|an) /, "");
const unique = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalized(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Detect explicit structural actions, not physical brush movement or an eye path.
export function structuralAction(value: string): boolean {
  const actions = value
    .split(/[,.;!?]|\band\b/i)
    .filter(
      (clause) =>
        !/\b(?:mov(?:e|ing|ed)|shift(?:ing|ed)?|rais(?:e|ing|ed)|lower(?:ing|ed)?) (?:your |the |a )?(?:brush|hand|arm|wrist|eye|gaze|attention)\b/i.test(
          clause,
        ),
    )
    .join("; ");
  return (
    /\b(?:crop(?:ping|ped)?|refram(?:e|ing|ed)|reposition(?:ing|ed)?|relocat(?:e|ing|ed)|redesign(?:ing|ed)?|rearrang(?:e|ing|ed))\b/i.test(
      actions,
    ) ||
    /\b(?:mov(?:e|ing|ed)|remov(?:e|ing|ed)|shift(?:ing|ed)?|rais(?:e|ing|ed)|lower(?:ing|ed)?|resiz(?:e|ing|ed)|chang(?:e|ing|ed)|alter(?:ing|ed)|widen(?:ing|ed)?|narrow(?:ing|ed)?|restructur(?:e|ing|ed))\b[^.;!?]{0,70}\b(?:horizon|spacing|proportions?|layout|focal (?:subject|placement)|house|pavilion|pier|buildings?|boats?|figures?|objects?|eye path|large (?:shapes?|masses))\b/i.test(
      actions,
    )
  );
}

const emphasize =
  /\b(?:sharpen(?:ing)?|sharp(?:er)?|crisp(?:er)?|strengthen(?:ing)?|emphasiz(?:e|ing)|reinforc(?:e|ing)|darken(?:ing)?|increase (?:the )?(?:contrast|chroma)|higher contrast|stronger contrast)\b/i;
const quiet =
  /\b(?:soften(?:ing)?|soft(?:er)?|quiet(?:en|ing)?|mut(?:e|ed|ing)|reduce (?:the )?(?:contrast|detail|chroma)|lower contrast|less contrast|simplif(?:y|ying))\b/i;

// Deliberately narrow: explicit named targets in the same short action clause.
// A separate roof/edge/side is not assumed to be the same area from pixels.
function directions(value: string, area: string): Set<"emphasize" | "quiet"> {
  const result = new Set<"emphasize" | "quiet">();
  const name = target(area);
  if (!name) return result;
  for (const clause of value.split(/[.;!?,]|\b(?:while|but|whereas|and)\b/i)) {
    const clean = normalized(clause);
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`(?:^| )${escaped}(?= |$)`).exec(clean);
    if (!match) continue;
    const start = match.index + (match[0].startsWith(" ") ? 1 : 0);
    const after = clean.slice(start + name.length);
    const before = clean.slice(0, start);
    // These identify a narrower or relational target, rather than area itself.
    if (
      /^ (?:s |roof\b|edge\b|side\b|window\b|reflections?\b|shadows?\b|background\b|foreground\b)/.test(
        after,
      ) ||
      /\b(?:behind|beyond|beside|near|around|above|below|outside|inside) (?:the )?$/.test(
        before,
      ) ||
      /\b(?:roof|edge|side|window|reflection|shadow|background|foreground) of (?:the )?$/.test(
        before,
      )
    )
      continue;
    const modifiers =
      "(?:(?:the|a|an|only|slightly|more|less|existing|nearby|distant|foreground|background|left|right|far|near|upper|lower|supporting|competing|surrounding|focal|in|at|on|of) ){0,4}";
    if (
      /\b(?:do not|don t|never|avoid)\b[^.;!?]{0,55}$/.test(before) ||
      /^ (?:(?:should|can|could|may) )?(?:not|never)\b/.test(after)
    )
      continue;
    const explicitEmphasis =
      /\b(?:sharpen(?:ing)?|strengthen(?:ing)?|emphasiz(?:e|ing)|reinforc(?:e|ing)|darken(?:ing)?|increase (?:the )?(?:contrast|chroma))\b/;
    const explicitQuiet =
      /\b(?:soften(?:ing)?|quiet(?:en|ing)?|mut(?:e|ing)|reduce (?:the )?(?:contrast|detail|chroma)|simplif(?:y|ying))\b/;
    // 'The pier is sharp' is evidence, while 'Keep the pier sharp' is advice.
    const directedPredicate =
      new RegExp(
        `\\b(?:keep|make|leave|paint|render|let|reserve) ${modifiers}$`,
        "i",
      ).test(before) || /^ (?:should|needs?|could|would benefit)\b/.test(after);
    const predicate = directedPredicate
      ? (after.match(
          /^ (?:(?:should|can|could|may) )?(?:(?:be|remain|stay|become|look|appear|is|needs?) )?(?:(?:slightly|more|less) )?[^ ]+(?: contrast)?/i,
        )?.[0] ?? "")
      : "";
    const lessSharp =
      /\bless (?:sharp|crisp|defined|dark|contrast|chroma)\b/.test(predicate);
    const lessSoft = /\bless soft\b/.test(predicate);
    if (
      new RegExp(`${explicitEmphasis.source} ${modifiers}$`, "i").test(
        before,
      ) ||
      (!lessSharp && emphasize.test(predicate)) ||
      lessSoft
    )
      result.add("emphasize");
    if (
      new RegExp(`${explicitQuiet.source} ${modifiers}$`, "i").test(before) ||
      (!lessSoft && quiet.test(predicate)) ||
      lessSharp
    )
      result.add("quiet");
  }
  return result;
}

export function usableCoachingDecision(
  value: unknown,
): CoachingDecision | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (
    Object.keys(v).length !== fields.length ||
    Object.keys(v).some((key) => !fields.includes(key)) ||
    !text(v.primaryGoal) ||
    !text(v.primarySubjectOrArea, 100)
  )
    return null;
  for (const key of [
    "areasToEmphasize",
    "areasToQuiet",
    "supportingObservations",
  ]) {
    if (
      !Array.isArray(v[key]) ||
      v[key].length > 3 ||
      !v[key].every((item: unknown) =>
        text(item, key === "supportingObservations" ? 350 : 100),
      )
    )
      return null;
  }
  for (const key of [
    "currentPaintingAction",
    "nextStudyAction",
    "compositionImplication",
    "colourImplication",
    "techniqueImplication",
  ]) {
    if (v[key] !== null && !text(v[key])) return null;
  }
  const decision: CoachingDecision = {
    ...(v as unknown as CoachingDecision),
    areasToEmphasize: unique(v.areasToEmphasize as string[]),
    areasToQuiet: unique(v.areasToQuiet as string[]),
    supportingObservations: unique(v.supportingObservations as string[]),
  };
  const shared = decision.areasToEmphasize.filter((area) =>
    decision.areasToQuiet.some((other) => target(other) === target(area)),
  );
  for (const area of shared) {
    const primary = directions(decision.primaryGoal, area);
    if (!primary.has("emphasize") || primary.has("quiet"))
      decision.areasToEmphasize = decision.areasToEmphasize.filter(
        (item) => target(item) !== target(area),
      );
    if (!primary.has("quiet") || primary.has("emphasize"))
      decision.areasToQuiet = decision.areasToQuiet.filter(
        (item) => target(item) !== target(area),
      );
  }
  for (const area of [...decision.areasToQuiet]) {
    const primary = directions(decision.primaryGoal, area);
    if (primary.has("emphasize") && !primary.has("quiet")) {
      decision.areasToQuiet = decision.areasToQuiet.filter(
        (item) => target(item) !== target(area),
      );
      decision.areasToEmphasize = unique([
        area,
        ...decision.areasToEmphasize,
      ]).slice(0, 3);
    }
  }
  for (const area of [...decision.areasToEmphasize]) {
    const primary = directions(decision.primaryGoal, area);
    if (primary.has("quiet") && !primary.has("emphasize")) {
      decision.areasToEmphasize = decision.areasToEmphasize.filter(
        (item) => target(item) !== target(area),
      );
      decision.areasToQuiet = unique([area, ...decision.areasToQuiet]).slice(
        0,
        3,
      );
    }
  }
  if (
    decision.currentPaintingAction &&
    structuralAction(decision.currentPaintingAction)
  ) {
    decision.nextStudyAction ??= decision.currentPaintingAction;
    decision.currentPaintingAction = null;
  }
  for (const key of [
    "currentPaintingAction",
    "nextStudyAction",
    "compositionImplication",
    "colourImplication",
    "techniqueImplication",
  ] as const) {
    if (decision[key] && conflictsWithDecision(decision[key], decision))
      decision[key] = null;
  }
  return decision;
}

export function conflictsWithDecision(
  value: string,
  decision: CoachingDecision,
): boolean {
  return (
    decision.areasToQuiet.some((area) =>
      directions(value, area).has("emphasize"),
    ) ||
    decision.areasToEmphasize.some((area) =>
      directions(value, area).has("quiet"),
    )
  );
}

// Keep the strongest decision; omit obvious conflicting secondary instructions.
// No metadata means legacy results stay unchanged. This is a text guard, not a
// semantic judge: synonyms, ambiguous target names and nuanced effects remain
// the model's responsibility and must not invent geometry or positive evidence.
export function coherentFeedback<T>(
  value: T,
  mode: "improve_painting" | "create_reference",
): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const original = value as Record<string, unknown>;
  if (
    !Object.hasOwn(original, "coachingDecision") ||
    original.coachingDecision === null
  )
    return value;
  const result = { ...original };
  const decision = usableCoachingDecision(result.coachingDecision);
  if (!decision) {
    delete result.coachingDecision;
    return result as T;
  }
  result.coachingDecision = decision;
  if (result.coachingMode === "study") decision.currentPaintingAction = null;
  // Never repair malformed required data: the strict core gate still rejects it.
  if (mode === "improve_painting" && text(result.mainAdvice, 700))
    result.mainAdvice = decision.primaryGoal;
  for (const key of ["whatWorks", "whatToFix"]) {
    if (
      Array.isArray(result[key]) &&
      result[key].length <= 8 &&
      result[key].every((item: unknown) => text(item))
    ) {
      const items = unique(result[key] as string[]);
      const coherent = items.filter(
        (item) => !conflictsWithDecision(item, decision),
      );
      result[key] = (
        key === "whatWorks" && items.length && !coherent.length
          ? decision.supportingObservations.filter(
              (item) => !conflictsWithDecision(item, decision),
            )
          : coherent
      ).slice(0, 3);
    }
  }
  for (const [key, implication] of [
    ["composition", decision.compositionImplication],
    ["values", decision.colourImplication],
    ["sketch", decision.nextStudyAction],
  ] as const) {
    if (
      text(result[key], 700) &&
      conflictsWithDecision(result[key] as string, decision)
    )
      result[key] =
        implication && !conflictsWithDecision(implication, decision)
          ? implication
          : decision.primaryGoal;
  }
  if (
    text(result.practice, 700) &&
    conflictsWithDecision(result.practice as string, decision)
  ) {
    if (mode === "create_reference") delete result.practice;
    else {
      const action =
        decision.nextStudyAction &&
        !conflictsWithDecision(decision.nextStudyAction, decision)
          ? decision.nextStudyAction
          : decision.primaryGoal;
      result.practice = `For 15 minutes, practise this on a separate study: ${action}`;
    }
  }
  for (const key of ["promising", "paletteStrategy", "prompt"]) {
    if (
      text(result[key], key === "prompt" ? 700 : 350) &&
      conflictsWithDecision(result[key] as string, decision)
    ) {
      if (key === "prompt")
        result.prompt = `How can I practise this decision in a separate study: ${decision.primaryGoal}`;
      else delete result[key];
    }
  }
  if (Array.isArray(result.overlays)) {
    const priority = (note: unknown) => {
      if (!note || typeof note !== "object") return 3;
      return (
        ({ high: 0, medium: 1, low: 2 } as Record<string, number>)[
          (note as Record<string, unknown>).priority as string
        ] ?? 3
      );
    };
    result.overlays = result.overlays
      .filter((note) => {
        if (!note || typeof note !== "object" || Array.isArray(note))
          return true;
        return !["label", "shortInstruction", "reason", "action"].some(
          (key) =>
            typeof note[key] === "string" &&
            conflictsWithDecision(note[key], decision),
        );
      })
      .sort((a, b) => priority(a) - priority(b))
      .slice(0, 3)
      .map((note) => {
        if (
          note &&
          typeof note === "object" &&
          typeof note.action === "string" &&
          structuralAction(note.action)
        )
          return { ...note, timing: "next_study" };
        return note;
      });
  }
  if (Array.isArray(result.brushPlan))
    result.brushPlan = result.brushPlan
      .filter((step) => {
        if (!step || typeof step !== "object" || Array.isArray(step))
          return true;
        return !Object.values(step).some(
          (item) =>
            typeof item === "string" && conflictsWithDecision(item, decision),
        );
      })
      .slice(0, 3);
  if (
    result.compositionDecision &&
    typeof result.compositionDecision === "object" &&
    !Array.isArray(result.compositionDecision)
  ) {
    const composition = {
      ...(result.compositionDecision as Record<string, unknown>),
    };
    for (const key of ["mainIssue", "reason", "tryNow", "nextStudy"]) {
      if (
        typeof composition[key] === "string" &&
        conflictsWithDecision(composition[key] as string, decision)
      )
        composition[key] = null;
    }
    if (
      typeof composition.tryNow === "string" &&
      structuralAction(composition.tryNow)
    ) {
      composition.nextStudy ??= composition.tryNow;
      composition.tryNow = null;
    }
    result.compositionDecision = composition;
  }
  if (Array.isArray(result.palette))
    result.palette = result.palette.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const colour = { ...item };
      for (const key of ["use", "mix"])
        if (
          typeof colour[key] === "string" &&
          conflictsWithDecision(colour[key], decision)
        )
          delete colour[key];
      return colour;
    });
  if (
    Array.isArray(result.steps) &&
    result.steps.length <= 8 &&
    result.steps.every((item: unknown) => text(item))
  ) {
    const steps = result.steps.filter(
      (item) =>
        typeof item !== "string" || !conflictsWithDecision(item, decision),
    );
    // A wholly conflicting valid sequence falls back only to the supplied goal.
    result.steps =
      steps.length || !result.steps.length
        ? steps
        : [`Study goal: ${decision.nextStudyAction ?? decision.primaryGoal}`];
  }
  return result as T;
}
