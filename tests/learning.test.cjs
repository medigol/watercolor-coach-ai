const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const load = require("./helpers/learning-loader.cjs");
const { modules, skills, styles, defaultProfile } = load(
  "learning/catalogue.ts",
);
const { items, lessons, project } = load("learning/content.ts");
const { validProfile, prerequisiteErrors, curriculumErrors } = load(
  "learning/validation.ts",
);
const { makePath, sessionPlan } = load("learning/engine.ts");
const {
  emptyProgress,
  decodeProgress,
  newEntry,
  editEntry,
  finishStep,
  stepReady,
  checklistId,
  completed,
  resumeStep,
  learningStatus,
  LearningStore,
} = load("learning/progress.ts");
const { validMedia, videoUrls, mediaResources } = load("learning/media.ts");
const { withStylePreferences } = load("learning/catalogue.ts");
test("style-only confirmation preserves confirmed goals/time and leaves an unfinished questionnaire separate", () => {
  const base = { ...defaultProfile, goal: "urban", minutes: 15 };
  const draft = {
    ...base,
    goal: "realism",
    minutes: 60,
    primaryStyle: "botanical",
    secondaryStyles: ["urban"],
  };
  const value = withStylePreferences(base, draft);
  assert.equal(value.goal, "urban");
  assert.equal(value.minutes, 15);
  assert.equal(value.primaryStyle, "botanical");
  assert.deepEqual(value.secondaryStyles, ["urban"]);
  assert.equal(draft.goal, "realism");
  assert.equal(base.primaryStyle, "atmospheric");
});
const personal = (patch = {}) => ({
  ...emptyProgress(),
  mode: "personal",
  profile: { ...defaultProfile, ...patch },
});
const ids = (s) => makePath(s).recommendations.map((r) => r.itemId);
function finish(item, state = emptyProgress(), difficulty = "useful") {
  for (const [index, step] of item.steps.entries()) {
    state = editEntry(state, item, (e) => {
      e.checked[step.id] = step.checklist.map((_, i) =>
        checklistId(step.id, i),
      );
      if (index === item.steps.length - 1) {
        e.notes["reflection-text"] =
          "The dry comparison clarified one boundary. I will repeat it with one change.";
        e.notes["reflection-difficulty"] = difficulty;
        e.notes["reflection-confidence"] = "developing";
      }
    });
    state = finishStep(state, item, index);
  }
  return state;
}
test("12-module framework has no broken references, duplicate IDs, cycles or dishonest available lessons", () => {
  assert.equal(modules.length, 12);
  assert.equal(lessons.length, 4);
  assert.equal(items.length, 5);
  assert.deepEqual(curriculumErrors(), []);
  assert.equal(
    modules.reduce((n, m) => n + m.lessonIds.length, 0),
    5,
  );
  assert(modules.some((m) => m.lessonIds.length === 0));
  for (const m of modules) assert.equal(m.editorialStatus, "framework");
});
for (const item of items)
  test(`${item.id}: original complete study, realistic timing, stable steps and actual route`, () => {
    assert(item.objectives.length >= 3);
    assert(item.why.length > 100);
    assert(item.exercise.success.length >= 3);
    assert(
      item.steps.every(
        (s) =>
          s.explanation.length > 100 &&
          s.checklist.length &&
          s.observe &&
          s.pitfall,
      ),
    );
    assert.equal(
      item.steps.reduce((n, s) => n + s.minutes, 0),
      item.instructionMinutes + item.practiceMinutes,
    );
    assert(item.steps.every((s) => s.minutes <= 15));
    assert(
      fs.existsSync(path.resolve(__dirname, "../app/(tabs)/learn/lesson.tsx")),
    );
    assert.equal(item.editorialStatus, "internally-reviewed");
    assert.equal(item.availability, "available");
  });
test("graph validator distinguishes cycles, missing prerequisites and duplicate IDs", () => {
  assert.match(
    prerequisiteErrors([
      { id: "a", prerequisites: ["b"] },
      { id: "b", prerequisites: ["a"] },
    ]).join(),
    /Circular/,
  );
  assert.match(
    prerequisiteErrors([{ id: "a", prerequisites: ["missing"] }]).join(),
    /Missing/,
  );
  assert.match(
    prerequisiteErrors([
      { id: "a", prerequisites: [] },
      { id: "a", prerequisites: [] },
    ]).join(),
    /Duplicate/,
  );
});
test("available styles use distinct decisions and skills, not decorative preference labels", () => {
  assert.equal(styles.length, 4);
  assert.equal(new Set(styles.map((s) => s.decisions.join())).size, 4);
  assert(
    styles.every(
      (s) =>
        s.exercise &&
        s.related.length &&
        s.skillIds.every((id) => skills.some((k) => k.id === id)),
    ),
  );
});
test("valid default profile collects no identity or invented skill scores", () => {
  assert(validProfile(defaultProfile));
  assert.deepEqual(defaultProfile.diagnostic, {});
});
for (const patch of [
  { minutes: 90 },
  { experience: "expert" },
  { goal: "unknown" },
  { subject: "unknown" },
  { primaryStyle: "famous-artist" },
  { secondaryStyles: ["urban", "urban"] },
  { secondaryStyles: ["atmospheric"] },
  { diagnostic: { "water-control": 100 } },
  { diagnostic: { unknown: "confident" } },
  { email: "private@example.invalid" },
  { weeklySessions: 0 },
  { format: "ai" },
])
  test(`profile rejects invalid or unnecessary data ${JSON.stringify(patch)}`, () =>
    assert(!validProfile({ ...defaultProfile, ...patch })));
test("standard mode starts immediately without a profile and respects prerequisites", () => {
  const s = emptyProgress();
  assert.equal(s.profile, null);
  assert.deepEqual(ids(s), [
    "water-brush",
    "three-values",
    "edge-families",
    "quiet-landscape",
  ]);
});
test("beginner with 15 minutes receives feasible multiple sessions, not a fictitious 15-minute project", () => {
  const p = makePath(personal());
  assert.equal(p.recommendations[0].itemId, "water-brush");
  assert.match(
    p.recommendations.find((r) => r.itemId === project.id).sessionPlan,
    /6 short sessions.*15/,
  );
  assert.match(
    p.recommendations.find((r) => r.itemId === project.id).sessionPlan,
    /drying/,
  );
});
test("atmospheric beginner sees values before edges and water before edge prerequisites", () => {
  const s = personal({ goal: "atmosphere" });
  const order = ids(s);
  assert(order.indexOf("water-brush") < order.indexOf("edge-families"));
  assert(order.indexOf("three-values") < order.indexOf("edge-families"));
  assert.match(
    makePath(s).recommendations.find((r) => r.itemId === "three-values").reason,
    /tonal/,
  );
});
test("intermediate urban painter with confident water and weak perspective starts with actual structural practice", () => {
  const s = personal({
    experience: "intermediate",
    goal: "urban",
    subject: "urban",
    primaryStyle: "urban",
    diagnostic: { "water-control": "confident", perspective: "new" },
  });
  assert.equal(ids(s)[0], "observed-structure");
  assert(!ids(s).includes("water-brush"));
  assert.match(makePath(s).recommendations[0].reason, /perspective/);
});
test("advanced learner can inspect optional foundation refreshers without a forced beginner path", () => {
  const p = makePath(personal({ experience: "advanced" }));
  assert.equal(p.recommendations[0].itemId, project.id);
  assert(p.refresherIds.includes("water-brush"));
  assert(p.recommendations[0].prerequisiteNotes.length > 0);
  assert.match(p.limitations[0], /not an assessment/);
});
test("multiple styles cause a real observation study to be included", () => {
  const single = ids(personal()),
    multi = ids(personal({ secondaryStyles: ["urban"] }));
  assert(!single.includes("observed-structure"));
  assert(multi.includes("observed-structure"));
});
test("changing primary style changes ordering and subject application", () => {
  const a = personal({ primaryStyle: "atmospheric" }),
    b = personal({ primaryStyle: "botanical", subject: "botanical" });
  assert.notDeepEqual(ids(a), ids(b));
  assert.match(
    makePath(b).recommendations.find((r) => r.itemId === "edge-families")
      .application,
    /leaf pair/,
  );
});
test("changing available time changes the actual session plan without erasing work", () => {
  const s = finish(lessons[0], personal());
  const before = structuredClone(s.entries);
  const shorter = { ...s, profile: { ...s.profile, minutes: 10 } };
  assert.notEqual(
    makePath(s).recommendations.at(-1).sessionPlan,
    makePath(shorter).recommendations.at(-1).sessionPlan,
  );
  assert.deepEqual(shorter.entries, before);
});
test("all 10,15,30,45,60 minute settings produce bounded useful session descriptions", () => {
  for (const n of [10, 15, 30, 45, 60])
    for (const i of items) assert.match(sessionPlan(i.id, n), /active minutes/);
});
test("project session estimates keep whole ordered activities rather than dividing total time", () => {
  // Independently packed durations: 4,7,6,8,8,10,10,7. At 15 minutes:
  // [4+7], [6+8], [8], [10], [10], [7]; at 30: [4+7+6+8], [8+10+10], [7].
  for (const [minutes, count] of [
    [10, 8],
    [15, 6],
    [30, 3],
    [45, 2],
  ]) {
    assert.match(
      sessionPlan(project.id, minutes),
      new RegExp(`^${count} short sessions`),
    );
    assert.match(sessionPlan(project.id, minutes), /60 active minutes total/);
  }
  assert.match(sessionPlan(project.id, 60), /^60 active minutes, plus/);
});
test("a completed study remains available for revisiting after changing preferences", () => {
  const s = finish(lessons[0], personal());
  const changed = {
    ...s,
    profile: { ...s.profile, primaryStyle: "urban", goal: "urban" },
  };
  assert(completed(lessons[0], changed.entries[lessons[0].id]));
  assert.equal(
    changed.entries[lessons[0].id].reflection.text,
    s.entries[lessons[0].id].reflection.text,
  );
  assert(makePath(changed).refresherIds.includes(lessons[0].id));
});
test("difficulty reflection prioritises a reasoned revision instead of inventing an assessed weakness", () => {
  const s = finish(lessons[1], personal(), "challenging"),
    p = makePath(s);
  assert(p.revisionIds.includes(lessons[1].id));
  assert.equal(p.recommendations[0].itemId, lessons[1].id);
  assert.match(p.recommendations[0].reason, /You described.*challenging/);
});
test("opening or beginning a page cannot mark a lesson completed", () => {
  assert(!completed(lessons[0], undefined));
  const state = editEntry(emptyProgress(), lessons[0], () => {});
  assert(!completed(lessons[0], state.entries[lessons[0].id]));
  assert.equal(
    learningStatus(lessons[0], state.entries[lessons[0].id]),
    "In progress",
  );
});
for (const item of items)
  test(`${item.id}: steps, comparison and reflection complete without any upload or model call`, () => {
    const s = finish(item);
    assert(completed(item, s.entries[item.id]));
    assert.deepEqual(decodeProgress(JSON.stringify(s)), s);
    assert.match(learningStatus(item, s.entries[item.id]), /self-reported/);
  });
test("jumping to final reflection cannot skip earlier activity completion", () => {
  const item = lessons[0],
    index = item.steps.length - 1;
  const s = editEntry(emptyProgress(), item, (e) => {
    e.stepId = item.steps[index].id;
    e.checked[e.stepId] = item.steps[index].checklist.map((_, n) =>
      checklistId(e.stepId, n),
    );
    e.notes = {
      "reflection-text": "I compared two edges.",
      "reflection-confidence": "comfortable",
      "reflection-difficulty": "useful",
    };
  });
  assert(!stepReady(item, index, s.entries[item.id]));
  assert.throws(() => finishStep(s, item, index), /Complete/);
});
test("project preserves the exact step, checklist and note through a serialized reload", () => {
  let s = editEntry(emptyProgress(), project, (e) => {
    e.stepId = "hill";
    e.notes.hill = "Waited until the shine diminished.";
    e.checked.hill = [checklistId("hill", 0)];
  });
  s = decodeProgress(JSON.stringify(s));
  assert.equal(
    project.steps[resumeStep(project, s.entries[project.id])].id,
    "hill",
  );
  assert.equal(
    s.entries[project.id].notes.hill,
    "Waited until the shine diminished.",
  );
});
test("unknown content stays preserved without fabricated routes or invalidating valid current work", () => {
  const s = emptyProgress();
  s.entries["retired-study"] = {
    ...newEntry(lessons[0]),
    itemId: "retired-study",
    stepId: "old-step",
  };
  const next = decodeProgress(JSON.stringify(s));
  assert(next.entries["retired-study"]);
  assert.doesNotThrow(() => makePath(next));
});
test("content version changes do not silently rewrite old work or claim current completion", () => {
  const s = finish(lessons[0]);
  s.entries[lessons[0].id].contentVersion = 2;
  const restored = decodeProgress(JSON.stringify(s));
  assert(!completed(lessons[0], restored.entries[lessons[0].id]));
  assert.equal(resumeStep(lessons[0], restored.entries[lessons[0].id]), 0);
  assert.throws(
    () => editEntry(restored, lessons[0], () => {}),
    /earlier content version/,
  );
});
for (const raw of [
  "{",
  JSON.stringify({ schemaVersion: 2 }),
  JSON.stringify({
    ...emptyProgress(),
    entries: JSON.parse('{"__proto__":{}}'),
  }),
  JSON.stringify({ ...emptyProgress(), currentItemId: "javascript:alert(1)" }),
])
  test(`invalid storage is rejected without a fabricated success: ${raw.slice(0, 50)}`, () =>
    assert.throws(() => decodeProgress(raw), /preserved/));
function adapter() {
  const data = new Map();
  let fail = false;
  return {
    data,
    set fail(v) {
      fail = v;
    },
    async getItem(k) {
      return data.get(k) ?? null;
    },
    async setItem(k, v) {
      if (fail) throw Error("Storage full");
      data.set(k, v);
    },
  };
}
test("serialized local writes preserve the newest complete snapshot", async () => {
  const a = adapter(),
    store = new LearningStore(a, "learner:a");
  await store.load();
  const first = emptyProgress(),
    second = finish(lessons[0], first);
  await Promise.all([store.save(first), store.save(second)]);
  const restored = await new LearningStore(a, "learner:a").load();
  assert(completed(lessons[0], restored.entries[lessons[0].id]));
});
test("failed save reports failure and can be retried; no memory-only successful save", async () => {
  const a = adapter(),
    store = new LearningStore(a, "learner:a");
  const state = await store.load();
  a.fail = true;
  await assert.rejects(store.save(state), /Storage full/);
  assert(!a.data.has("learner:a"));
  a.fail = false;
  await store.save(state);
  assert(a.data.has("learner:a"));
});
test("cross-tab changes reject overwriting and preserve the other tab's snapshot", async () => {
  const a = adapter(),
    one = new LearningStore(a, "learner:a"),
    two = new LearningStore(a, "learner:a");
  await one.load();
  await two.load();
  const updated = finish(lessons[0]);
  await one.save(updated);
  await assert.rejects(two.save(emptyProgress()), /another tab/);
  assert.deepEqual(await one.load(), updated);
});
test("different signed-in learner keys do not share progress", async () => {
  const a = adapter(),
    one = new LearningStore(a, "learner:a"),
    two = new LearningStore(a, "learner:b");
  await one.load();
  await one.save(finish(project));
  assert.deepEqual((await two.load()).entries, {});
});
test("corrupt data is not overwritten on load failure; explicit recovery makes a backup first", async () => {
  const a = adapter();
  a.data.set("learner:a", "broken");
  const store = new LearningStore(a, "learner:a");
  await assert.rejects(store.load());
  await assert.rejects(store.save(emptyProgress()), /not loaded/);
  assert.equal(a.data.get("learner:a"), "broken");
  await store.recoverWithBackup();
  assert(
    [...a.data.entries()].some(
      ([k, v]) => k.startsWith("learner:a:backup:") && v === "broken",
    ),
  );
  assert.equal(decodeProgress(a.data.get("learner:a")).schemaVersion, 1);
});
test("failed recovery backup cannot discard the corrupt source", async () => {
  const a = adapter();
  a.data.set("learner:a", "broken");
  a.fail = true;
  await assert.rejects(new LearningStore(a, "learner:a").recoverWithBackup());
  assert.equal(a.data.get("learner:a"), "broken");
});
const resource = () => ({
  id: "technical-test",
  videoId: "abcDEF123_-",
  url: "https://www.youtube.com/watch?v=abcDEF123_-",
  creator: "Synthetic test creator",
  title: "Test only",
  language: "en",
  lessonIds: ["water-brush"],
  skillIds: ["water-control"],
  styleTags: [],
  subjectTags: [],
  difficulty: "foundation",
  purpose: "Validation fixture only, not a production video",
  verifiedAt: "2026-01-01",
  verified: true,
  availability: "available",
  embeddable: true,
  durationSeconds: 120,
  segments: [
    { title: "Test segment", start: 30, end: 50, watchFor: "A technical test" },
  ],
});
test("production catalogue contains no guessed or fake video records", () =>
  assert.deepEqual(mediaResources, []));
test("verified-resource contract makes canonical attributed URLs and user-controlled start parameter", () => {
  const r = resource();
  assert(validMedia(r));
  const u = videoUrls(r, 30);
  assert.match(u.embed, /youtube-nocookie.com\/embed\/abcDEF123_-\?start=30/);
  assert.match(u.embed, /controls=1/);
  assert.match(u.embed, /autoplay=0/);
  assert.equal(u.external, r.url + "&t=30s");
});
for (const mutate of [
  (r) => (r.videoId = "javascript:bad"),
  (r) => (r.url = "https://attacker.invalid"),
  (r) => (r.verified = false),
  (r) => (r.segments[0].start = -1),
  (r) => (r.segments[0].end = 200),
  (r) => (r.creator = ""),
  (r) => (r.lessonIds = ["unavailable"]),
  (r) => (r.skillIds = ["invented"]),
  (r) => (r.embeddable = "yes"),
])
  test(`invalid video input is rejected: ${mutate.toString()}`, () => {
    const r = resource();
    mutate(r);
    assert(!validMedia(r));
  });
for (const start of [-1, 120, 1.5, Infinity, NaN])
  test(`invalid timestamp ${start} does not produce a player URL`, () =>
    assert.equal(videoUrls(resource(), start), null));
