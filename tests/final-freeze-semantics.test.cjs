const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/semantic-cleanup-fixture.cjs");
const { workspaceTeaching } = loadShared(
  "../shared/coachingWorkspace.ts",
  "lib/overlays.ts",
);
const { assessCoaching, supportedExplanation } = loadShared(
  "../shared/coachingAssessment.ts",
  "lib/overlays.ts",
);
const {
  paintingLevelText,
  visibleTeachingText,
  futureTeachingText,
  strengthTeachingText,
  tidyTeachingText,
  neutralStudyText,
  honestStylisticAlternative,
} = loadShared("../shared/coachingSemantics.ts", "lib/overlays.ts");
function issue(r, property = "depth", classification = "clear_issue") {
  const drawing = property === "perspective";
  const observation = drawing
    ? "The vehicle perspective is inconsistent and flattens spatial depth."
    : "Disconnected water bands flatten spatial depth around the boat.";
  const i = {
    id: "supported-issue",
    domain: "overall",
    classification,
    factIds: ["problem-fact"],
    lesson: observation,
    action: drawing
      ? "On a separate study, align vehicle perspective and compare spatial depth."
      : "On a separate study, connect water value bands and compare spatial depth.",
  };
  r.canonicalAnalysis.facts.push({
    id: "problem-fact",
    domain: "overall",
    observation,
    roleId: null,
  });
  r.canonicalAnalysis.insights.push(i);
  return i;
}

for (const kind of ["church", "van", "boat"])
  test(`semantic freeze ${kind}: hidden critique and person judgement are removed across the workspace`, () => {
    const r = fixture(kind),
      before = structuredClone(r),
      t = workspaceTeaching(r);
    assert.equal(t.assessment.level, "strong");
    assert(t.status.includes("No major issue detected"));
    const displayed = JSON.stringify({
      assessment: t.assessment,
      strengths: t.strengths,
      practice: t.practice,
      studies: t.studies,
      facts: t.displaySource.canonicalAnalysis.facts,
    });
    assert(
      !/room for improvement|foundational|mastery|refining edges|improving background|contrast contrast|pigment application|is painted with|gauge improvement|perspective accuracy/.test(
        displayed,
      ),
      displayed,
    );
    assert.equal(t.recommendations.length, 0);
    assert.deepEqual(r, before);
    assert.equal(r.canonicalAnalysis.version, 1);
  });
test("semantic freeze Church normalization recognizes solid control as a supplied painting property", () => {
  const r = fixture();
  const t = workspaceTeaching(r);
  assert(t.assessment.rationale.includes("strong value contrast"));
  assert(t.assessment.rationale.includes("effectively balances"));
  assert.equal(t.assessment.level, "strong");
  assert.equal(r.canonicalAnalysis.qualityAssessment.level, "competent");
});
for (const level of ["strong", "highly_resolved", "competent"])
  test(`semantic freeze ${level}: unsupported room-for-improvement clause is removed`, () => {
    const r = fixture();
    r.canonicalAnalysis.qualityAssessment.level = level;
    const t = workspaceTeaching(r);
    assert(!/room for improvement/.test(t.assessment.rationale));
    assert(t.assessment.rationale.includes("value contrast"));
  });
for (const classification of [
  "clear_issue",
  "optional_refinement",
  "study_experiment",
])
  test(`semantic freeze supported ${classification} limitation survives without unsafe upgrade`, () => {
    const r = fixture();
    const i = issue(r, "depth", classification);
    r.canonicalAnalysis.qualityAssessment.rationale =
      "Clear focal hierarchy supports the atmosphere. There is room for improvement in water depth.";
    if (classification === "study_experiment")
      i.action =
        "On a separate study, compare two studies of connected versus disconnected water value bands; keep the boat fixed and choose the clearer depth.";
    const t = workspaceTeaching(r);
    assert.equal(t.assessment.level, "competent");
    assert(t.assessment.rationale.includes("room for improvement"));
    assert(
      [...t.recommendations.map((r) => r.insight), ...t.studies].some(
        (s) => s.id === i.id,
      ),
    );
  });
test("semantic freeze a different property cannot justify hidden rationale critique", () => {
  const r = fixture();
  issue(r);
  r.canonicalAnalysis.qualityAssessment.rationale =
    "Clear focal hierarchy supports the atmosphere. There is room for improvement in vehicle perspective.";
  assert(!workspaceTeaching(r).assessment.rationale.includes("perspective"));
});
for (const [label, mutate] of [
  ["no factual strength", (r) => (r.canonicalAnalysis.insights = [])],
  [
    "low confidence",
    (r) => (r.canonicalAnalysis.qualityAssessment.confidence = 0.79),
  ],
  [
    "uncertainty",
    (r) =>
      (r.canonicalAnalysis.qualityAssessment.rationale =
        "The value hierarchy seems clear and perhaps coherent."),
  ],
  [
    "no positive rationale",
    (r) =>
      (r.canonicalAnalysis.qualityAssessment.rationale =
        "A tower stands beside water."),
  ],
  [
    "negated property praise",
    (r) =>
      (r.canonicalAnalysis.qualityAssessment.rationale =
        "The painting does not have solid control of value contrasts."),
  ],
])
  test(`semantic freeze zero recommendations alone cannot upgrade: ${label}`, () => {
    const r = fixture();
    mutate(r);
    assert.equal(workspaceTeaching(r).assessment.level, "competent");
  });
for (const tail of [
  "and.",
  "but.",
  "with.",
  "room for improvement in depth..",
  "but there is room for improvement in depth.",
])
  test(`semantic freeze rationale leaves no broken tail: ${tail}`, () => {
    const r = fixture();
    r.canonicalAnalysis.qualityAssessment.rationale = `Clear value grouping supports depth, ${tail}`;
    const text = workspaceTeaching(r).assessment.rationale;
    assert(!/\.\.|\b(?:and|but|with)[,.!?]?$/i.test(text));
    assert(!/room for improvement/.test(text));
  });
for (const text of [
  "The painting has solid foundational skills.",
  "The painting demonstrates solid foundational understanding.",
  "The artist demonstrates skill.",
  "The painter shows professional experience.",
  "Experienced handling gives depth.",
  "Technical mastery supports the mood.",
  "Control of watercolor techniques is solid.",
  "The artist shows professionalism.",
])
  test(`semantic freeze person judgement omitted: ${text}`, () => {
    assert.equal(paintingLevelText(text), "");
  });
test("semantic freeze person cleanup preserves an independent supplied property statement", () => {
  assert.equal(
    paintingLevelText(
      "The artist demonstrates technical mastery. Clear value separation supports depth.",
    ),
    "Clear value separation supports depth.",
  );
});
test("semantic freeze explicit property language remains painting-level without substitute praise", () => {
  assert.equal(
    paintingLevelText("The painter shows solid control of value contrasts."),
    "The painting shows strong value contrast.",
  );
  assert.equal(paintingLevelText("The painter is experienced."), "");
});
test("semantic freeze Strength retains preservation while removing refining tail", () => {
  const input =
    "Preserve the sharp light-shadow contrast on the tower while refining edges to maintain focus.";
  assert.equal(
    strengthTeachingText(input),
    "Preserve the sharp light-shadow contrast on the tower.",
  );
});
for (const verb of [
  "refine",
  "fix",
  "improve",
  "correct",
  "increase",
  "sharpen",
  "soften",
  "strengthen",
  "adjust",
  "amplify",
])
  test(`semantic freeze ${verb} instruction cannot hide in a Strength lesson`, () => {
    const t = strengthTeachingText(
      `Clear light gives the tower readable separation. ${verb} the background edges.`,
    );
    assert.equal(t, "Clear light gives the tower readable separation.");
  });
test("semantic freeze valid descriptive verbs and preservation remain untouched", () => {
  for (const text of [
    "Preserve the value separation between tower and water.",
    "Selected crisp edges strengthen focal separation.",
    "The soft transitions improve atmospheric depth.",
  ])
    assert.equal(strengthTeachingText(text), text);
});
test("semantic freeze cleanup invents no correction or new classification", () => {
  const r = fixture();
  const t = workspaceTeaching(r);
  assert.equal(t.recommendations.length, 0);
  assert(t.strengths.every((i) => i.classification === "strength"));
  assert.equal(t.studies.length, 0);
});
for (const text of [
  "Warm–cool contrast contrast supports the mood.",
  "Clear clear values and soft soft edges support depth.",
  "Clear values support depth..",
])
  test(`semantic freeze obvious local repetition only: ${text}`, () => {
    const result = tidyTeachingText(text);
    assert(!/contrast contrast|clear clear|soft soft|\.\./i.test(result));
  });
test("semantic freeze grammatical nonduplicate wording is retained", () => {
  const text =
    "Soft distant transitions and crisp focal contours support the quiet scene.";
  assert.equal(tidyTeachingText(text), text);
});
test("semantic freeze explicit painted-with appearance retains only supplied visible properties", () => {
  const text = visibleTeachingText(
    "The boat is painted with more defined edges and darker pigment application, creating sharper contrast.",
  );
  assert.equal(
    text,
    "The boat has more defined edges and darker visible passages, creating sharper contrast.",
  );
});
for (const text of [
  "The boat was painted using a flat brush.",
  "The sky colour was applied with a large brush.",
  "The wash application creates atmosphere.",
  "Preserve the original handling.",
  "Pigment application supports the subject.",
])
  test(`semantic freeze unsupported original process is omitted: ${text}`, () =>
    assert.equal(visibleTeachingText(text), ""));
for (const text of [
  "Try a wash on scrap paper.",
  "On a separate study, compare wet-on-wet with wet-on-dry.",
  "On scrap paper, try dry brush.",
  "Mix Ultramarine and Burnt Sienna for a neutral wash.",
])
  test(`semantic freeze future method survives: ${text}`, () =>
    assert.equal(futureTeachingText(text), text));
for (const [lesson, action] of [
  [
    "The horizontal structure creates calm.",
    "Maintain the horizontal structure and off-centre placement.",
  ],
  [
    "The boat could be enhanced by stronger contrast or sharper edges.",
    "Increase edge sharpness or value contrast in a separate study.",
  ],
  [
    "The supporting edges need improvement.",
    "Compare stronger and weaker edge definition in a separate study.",
  ],
])
  test(`semantic freeze dishonest alternative omitted, never promoted: ${action}`, () => {
    const r = fixture();
    r.canonicalAnalysis.insights.push({
      id: "bad-alternative",
      domain: "technique",
      classification: "stylistic_alternative",
      factIds: ["edges"],
      lesson,
      action,
    });
    const t = workspaceTeaching(r);
    assert(!t.studies.some((i) => i.id === "bad-alternative"));
    assert(!t.recommendations.some((r) => r.insight.id === "bad-alternative"));
    assert(t.omittedInsightIds.includes("bad-alternative"));
    assert(t.noteExcludedInsightIds.includes("bad-alternative"));
    assert.equal(
      r.canonicalAnalysis.insights.at(-1).classification,
      "stylistic_alternative",
    );
  });
test("semantic freeze a genuine neutral alternative survives as a separate study", () => {
  const r = fixture();
  r.canonicalAnalysis.insights.push({
    id: "genuine-alternative",
    domain: "technique",
    classification: "stylistic_alternative",
    factIds: ["edges"],
    lesson:
      "A quieter versus a more graphic focal treatment offers two valid choices.",
    action:
      "Compare the two edge treatments on a separate study, holding value grouping constant and keeping supporting edges below the focal hierarchy.",
  });
  const t = workspaceTeaching(r),
    i = t.studies.find((i) => i.id === "genuine-alternative");
  assert(i);
  assert.equal(i.classification, "stylistic_alternative");
  assert(/separate(?: small)? study/.test(i.action));
  assert.equal(t.recommendations.length, 0);
});
test("semantic freeze independent valid correction survives omission of a mislabeled alternative", () => {
  const r = fixture();
  const i = issue(r);
  const t = workspaceTeaching(r);
  assert(t.recommendations.some((r) => r.insight.id === i.id));
  assert(!t.studies.some((i) => i.id === "corrective-alternative"));
});
test("semantic freeze Strong perspective exercise is neutralized without replacing its variable/constants/comparison", () => {
  const r = fixture("van");
  const t = workspaceTeaching(r);
  assert(!/accuracy|improvement/.test(t.practice));
  for (const words of [
    "perspective",
    "proportion",
    "viewing angle",
    "values and edges constant",
    "Compare",
    "readable silhouette",
  ])
    assert(t.practice.includes(words), t.practice);
});
test("semantic freeze supported perspective practice keeps supported corrective framing", () => {
  const r = fixture("van");
  issue(r, "perspective");
  r.expertViews.overall.practice =
    "On a separate study, paint two vehicle shapes varying only perspective accuracy. Keep the value grouping fixed. Compare the vehicle perspective in both to gauge improvement.";
  const t = workspaceTeaching(r);
  assert(t.recommendations.some((i) => i.insight.id === "supported-issue"));
  assert(t.practice.includes("perspective accuracy"));
  assert(t.practice.includes("gauge improvement"));
});
test("semantic freeze a neutral one-variable study is unchanged", () => {
  const text =
    "On a separate study, paint two tower shapes varying only value contrast. Keep edges constant. Compare which version holds the light most clearly.";
  assert.equal(
    neutralStudyText(text, () => false),
    text,
  );
});
test("semantic freeze an unsupported defect with no recoverable neutral variable is omitted", () => {
  assert.equal(
    neutralStudyText(
      "Correct the inaccurate perspective to fix the weak structure.",
      () => false,
    ),
    "",
  );
});
test("semantic freeze current one-variable safeguards still remove a conflicting edge change", () => {
  const r = fixture();
  r.expertViews.overall.practice =
    "On a separate study, paint two versions varying only value contrast and soften background edges. Keep the shapes constant. Compare which holds focal separation.";
  const p = workspaceTeaching(r).practice;
  assert(p.includes("value contrast"));
  assert(!p.includes("soften background edges"));
});
test("semantic freeze display keeps canonical roles, geometry, v1 and stored quality immutable", () => {
  const r = fixture(),
    before = structuredClone(r),
    t = workspaceTeaching(r);
  assert.deepEqual(r, before);
  assert.deepEqual(
    t.displaySource.canonicalAnalysis.visualRoles,
    r.canonicalAnalysis.visualRoles,
  );
  assert.deepEqual(
    t.displaySource.canonicalAnalysis.composition.primary.paths,
    r.canonicalAnalysis.composition.primary.paths,
  );
  assert.equal(t.displaySource.canonicalAnalysis.version, 1);
});
test("semantic freeze presentation helper has no provider, retry, upload or write path", () => {
  const code = fs.readFileSync("shared/coachingSemantics.ts", "utf8");
  assert(!/\b(?:fetch|invoke|upload|insert|update|retry)\s*\(/.test(code));
  assert(!/supabase|OpenAI|canvas|Image\.getSize/.test(code));
});

test("semantic freeze a comma-appended corrective gerund is removed from preservation", () => {
  assert.equal(
    strengthTeachingText(
      "Preserve the tower light, refining its edges to maintain focus.",
    ),
    "Preserve the tower light.",
  );
});
test("semantic freeze Strength instruction and preservation stay consistent in linked notes", () => {
  const r = fixture();
  const t = workspaceTeaching(r);
  const e = t.displaySource.canonicalAnalysis.visualEvidence[0];
  assert(!/refining/.test(e.note.shortInstruction));
  assert(e.note.shortInstruction.includes("Preserve"));
});

test("semantic freeze a Strength lesson preserves the positive relationship and removes a modal correction", () => {
  assert.equal(
    strengthTeachingText(
      "The reserved light creates clear separation, but the distant edges need refining.",
    ),
    "The reserved light creates clear separation",
  );
});
test("semantic freeze a material limitation cannot be displayed as What Works even when separately supported", () => {
  const r = fixture();
  const i = issue(r);
  r.canonicalAnalysis.insights[0].lesson = i.lesson;
  const t = workspaceTeaching(r);
  assert(!t.strengths.some((s) => s.id === "whole"));
  assert(t.recommendations.some((r) => r.insight.id === i.id));
});

test("semantic freeze removing person judgement never leaves a subjectless fragment", () => {
  assert.equal(
    paintingLevelText("Solid foundational skills and creates strong depth."),
    "",
  );
});

test("semantic freeze property conversion keeps singular agreement and sentence case", () => {
  assert.equal(
    paintingLevelText(
      "Solid control of value contrasts creates clear hierarchy.",
    ),
    "Strong value contrast creates clear hierarchy.",
  );
});

test("semantic freeze a successful relationship without needing extra marks remains a Strength", () => {
  const r = require("./helpers/analysis-depth-fixture.cjs")(),
    t = workspaceTeaching(r);
  const strength = t.strengths.find((i) => i.id === "whole");
  assert(strength);
  assert(strength.action.includes("Preserve the value separation"));
});

test("semantic freeze unknown painter praise is omitted rather than assigned to the painting", () => {
  assert.equal(
    paintingLevelText("The painter shows impressive technique."),
    "",
  );
});
test("semantic freeze an explicit supplied painter property can be retained without person judgement", () => {
  assert.equal(
    paintingLevelText("The artist demonstrates clear focal hierarchy."),
    "The painting demonstrates clear focal hierarchy.",
  );
});

test("semantic freeze genuine alternative can hold values fixed and explicitly say it is not a correction", () => {
  assert(
    honestStylisticAlternative(
      "A warmer versus cooler treatment offers two valid choices, not a correction.",
      "Compare the two temperature variants in a separate study with values fixed.",
    ),
  );
});
test("semantic freeze technical assessment cannot disguise supported correction as a stylistic alternative", () => {
  const r = fixture();
  const i = issue(r);
  i.domain = "colour_value";
  r.canonicalAnalysis.facts.at(-1).domain = "colour_value";
  r.canonicalAnalysis.colourAnalysis =
    require("./helpers/colour-fixture.cjs")();
  r.canonicalAnalysis.colourAnalysis.technicalAssessment = {
    kind: "stylistic_alternative",
    insightId: i.id,
    explanation:
      "Disconnected water values could be improved for clearer spatial depth.",
  };
  const t = workspaceTeaching(r);
  assert(t.recommendations.some((r) => r.insight.id === i.id));
  assert.equal(
    t.displaySource.canonicalAnalysis.colourAnalysis.technicalAssessment,
    null,
  );
});
test("semantic freeze a genuine technical-assessment alternative survives without implying a defect", () => {
  const r = fixture();
  r.canonicalAnalysis.colourAnalysis =
    require("./helpers/colour-fixture.cjs")();
  r.canonicalAnalysis.colourAnalysis.technicalAssessment = {
    kind: "stylistic_alternative",
    insightId: null,
    explanation:
      "Compare warmer versus cooler variants in a separate study, with values fixed. This is not a correction.",
  };
  assert(
    workspaceTeaching(r).displaySource.canonicalAnalysis.colourAnalysis
      .technicalAssessment,
  );
});

test("semantic freeze an alternative cannot append a separate corrective imperative", () => {
  assert.equal(
    honestStylisticAlternative(
      "Two focal treatments offer an alternative.",
      "Compare the two edge treatments; increase contrast around the subject.",
    ),
    false,
  );
});

test("semantic freeze descriptive Quiet note labels are not mistaken for corrective instructions", () => {
  const r = fixture();
  r.canonicalAnalysis.visualEvidence[0].note.label = "Quiet water passage";
  const { prepareCoachingDisplay } = loadShared(
    "../shared/coachingDisplay.ts",
    "lib/overlays.ts",
  );
  const note =
    prepareCoachingDisplay(r).canonicalAnalysis.visualEvidence[0].note;
  assert.equal(note.label, "Quiet water passage");
  assert(!note.shortInstruction.includes("refining"));
});

test("semantic freeze fixture reaches the UI as an actual canonical Strength", () => {
  const { cleanPaintingAnalysis, validPaintingAnalysis } = loadShared(
    "../shared/paintingAnalysis.ts",
    "lib/overlays.ts",
  );
  const r = cleanPaintingAnalysis(fixture(), (notes) => notes);
  assert(validPaintingAnalysis(r));
  assert.equal(
    r.canonicalAnalysis.insights.find((i) => i.id === "whole").classification,
    "strength",
  );
  const t = workspaceTeaching(r);
  assert(
    t.strengths
      .find((i) => i.id === "whole")
      .action.includes("Preserve the sharp light-shadow contrast"),
  );
});

test("semantic freeze neutralized study copy is shared by cards, note actions and note instructions", () => {
  const r = fixture("van"),
    c = r.canonicalAnalysis;
  const i = {
    id: "neutral-drawing-study",
    domain: "technique",
    classification: "study_experiment",
    factIds: ["edges"],
    lesson: "The focal silhouette remains readable.",
    action:
      "On a separate study, compare two vehicle shapes focusing on perspective accuracy. Keep values fixed and compare them to gauge improvement.",
  };
  c.insights.push(i);
  c.visualEvidence.push({
    ...structuredClone(c.visualEvidence[0]),
    insightId: i.id,
    note: {
      ...structuredClone(c.visualEvidence[0].note),
      id: "study-note",
      shortInstruction:
        "Compare two shapes for perspective accuracy to gauge improvement.",
    },
  });
  r.expertViews.overall.practice = "";
  const before = structuredClone(r),
    t = workspaceTeaching(r);
  assert(t.studies.some((s) => s.id === i.id));
  const { projectPaintingAnalysis } = loadShared(
    "../shared/paintingAnalysis.ts",
    "lib/overlays.ts",
  );
  const projected = projectPaintingAnalysis(t.displaySource, "overall");
  const note = projected.overlays.find((n) => n.id === "study-note");
  assert(note);
  assert(!/accuracy|improvement/.test(note.action));
  assert(!/accuracy|improvement/.test(note.shortInstruction));
  assert.deepEqual(r, before);
  c.visualEvidence.at(-1).note.shortInstruction = 7;
  assert.doesNotThrow(() => workspaceTeaching(r));
});
