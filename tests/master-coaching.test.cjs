const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/canonical-fixture.cjs"),
  colourFixture = require("./helpers/colour-fixture.cjs");
const painting = loadShared("../shared/paintingAnalysis.ts", "lib/overlays.ts");
const workspace = loadShared(
  "../shared/coachingWorkspace.ts",
  "lib/overlays.ts",
);
const language = loadShared("../shared/coachingLanguage.ts", "lib/overlays.ts");
const evidence = loadShared("../shared/coachingEvidence.ts", "lib/overlays.ts");
const overlays = {};
new Function(
  "exports",
  "require",
  ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../lib/overlays.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
)(overlays, (name) => loadShared(name, "lib/overlays.ts"));
const clean = (r) => painting.cleanPaintingAnalysis(r, overlays.usableOverlays);
const insight = (id, patch = {}) => ({
  id,
  domain: "composition",
  classification: "optional_refinement",
  factIds: ["path"],
  lesson: `${id}: the bank's detail could be quieter beside the tower.`,
  action: `On a separate study, reduce ${id} bank detail; compare which version keeps the tower dominant.`,
  ...patch,
});
function result(level = "competent", items = []) {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment.level = level;
  r.canonicalAnalysis.insights.push(...items);
  return r;
}

test("highly resolved work may have zero recommendations", () => {
  const t = workspace.workspaceTeaching(result("highly_resolved"));
  assert.equal(t.recommendations.length, 0);
  assert.equal(t.opportunity, undefined);
});
test("strong work can have a high-value elevation without a technical issue", () => {
  const r = result("strong", [insight("elevate")]);
  r.expertViews.overall.summaryId = "elevate";
  const t = workspace.workspaceTeaching(r);
  assert.equal(t.clear.length, 0);
  assert.equal(t.recommendations[0].label, "Main opportunity");
  assert.equal(
    t.recommendations[0].insight.classification,
    "optional_refinement",
  );
});
test("small optional advice on strong work is not automatically a main opportunity", () => {
  const t = workspace.workspaceTeaching(result("strong", [insight("small")]));
  assert.equal(t.recommendations[0].label, "Optional refinement");
  assert.equal(t.opportunity, undefined);
});
const priorities = () => [
  insight("value", {
    lesson: "The distant darks approach the focal contrast.",
    action:
      "Compress distant middle values on scrap and compare focal dominance.",
  }),
  insight("edges", {
    lesson: "Crisp background contours flatten the spatial recession.",
    action:
      "Test softer upper contours against current edges; compare the depth.",
  }),
  insight("rhythm", {
    lesson: "Evenly repeated marks crowd the open water.",
    action:
      "Compare fewer foreground accents with current spacing in a separate study.",
  }),
  insight("detail", {
    lesson: "The small wire shapes interrupt the reserved sky.",
    action: "Reduce wire density on scrap; compare the open light pattern.",
  }),
];
test("competent work surfaces multiple supplied priorities, capped at three", () => {
  const t = workspace.workspaceTeaching(result("competent", priorities()));
  assert.equal(t.recommendations.length, 3);
  assert.equal(t.recommendations[0].insight.id, "value");
  assert.equal(t.recommendations[0].label, "Main opportunity");
  assert.equal(t.recommendations[1].label, "Secondary opportunity");
});
test("developing work prioritises technical issues and remains capped", () => {
  const items = priorities();
  items[2].classification = "clear_issue";
  const t = workspace.workspaceTeaching(result("developing", items));
  assert.equal(t.recommendations.length, 3);
  assert.equal(t.recommendations[0].insight.id, "rhythm");
  assert.equal(t.status, "Main priority");
});
test("highly resolved useful refinements remain optional and capped at two", () => {
  const t = workspace.workspaceTeaching(
    result("highly_resolved", priorities()),
  );
  assert.equal(t.recommendations.length, 2);
  assert(t.recommendations.every((r) => r.label === "Optional refinement"));
});
test("repeated recommendations are not surfaced twice", () => {
  const item = priorities()[0];
  const t = workspace.workspaceTeaching(
    result("competent", [item, { ...item, id: "duplicate" }]),
  );
  assert.equal(t.recommendations.length, 1);
});
test("canonical high-priority evidence ranks meaningful strong-work elevation first", () => {
  const r = result("strong", priorities());
  r.canonicalAnalysis.visualEvidence.push({
    insightId: "edges",
    roleId: "bank",
    note: { priority: "high" },
  });
  const t = workspace.workspaceTeaching(r);
  assert.equal(t.recommendations[0].insight.id, "edges");
  assert.equal(t.recommendations[0].label, "Main opportunity");
});
test("quality rationale removes appended optional criticism, retaining the assigned-quality explanation", () => {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment.rationale =
    "Coherent light and clear hierarchy give the scene depth, though some edges could be refined.";
  const v = clean(r);
  assert(v);
  assert.match(
    v.canonicalAnalysis.qualityAssessment.rationale,
    /Coherent light/,
  );
  assert(
    !/though|refined/.test(v.canonicalAnalysis.qualityAssessment.rationale),
  );
});
test("a strength cannot hide an imperative correction", () => {
  const r = fixture();
  r.canonicalAnalysis.insights[1].action = "Increase the bank contrast.";
  const v = clean(r);
  assert.notEqual(v.canonicalAnalysis.insights[1].classification, "strength");
  assert(
    !workspace.workspaceTeaching(v).strengths.some((i) => i.id === "design"),
  );
});
test("transferable preservation remains a strength rather than a correction", () => {
  const r = fixture();
  r.canonicalAnalysis.insights[0].action =
    "Preserve the value separation between the tower and quiet water.";
  assert.equal(
    clean(r).canonicalAnalysis.insights[0].classification,
    "strength",
  );
});
test("generic central-placement preservation reuses an actual transferable relationship", () => {
  const r = fixture();
  r.canonicalAnalysis.insights[0].action = "Preserve the central placement.";
  const t = workspace.workspaceTeaching(r);
  assert.match(t.strengths[0].action, /Preserve this relationship/);
  assert(
    t.strengths[0].action.includes(r.canonicalAnalysis.facts[0].observation),
  );
});
for (const text of [
  "Adjust value contrast near the boat; compare lower and current contrast for clearer separation.",
  "Paint two background edge versions; compare which supports the focal house.",
  "On scrap watercolor paper, compare two foreground value groups for a clearer light pattern.",
])
  test(`practice is explicitly separate: ${text.slice(0, 32)}`, () => {
    const safe = language.separateStudyText(text);
    assert.match(
      safe,
      /^(?:On scrap watercolor paper|On a separate small study)/,
    );
    assert(language.variableStudy(safe));
  });
test("practice never instructs alteration of the finished painting", () => {
  assert.equal(
    language.separateStudyText(
      "Adjust your finished painting by reducing contrast.",
    ),
    "On a separate small study, adjust the study by reducing contrast.",
  );
});
test("an empty practice is not replaced with invented instructions", () =>
  assert.equal(language.separateStudyText(""), ""));
test("a controlled study changes one supplied variable and compares versions", () =>
  assert(
    language.variableStudy(
      "Compare two background value versions: compressed middles versus current contrast. See which gives clearer focal dominance.",
    ),
  ));
test("a generic strength repeated as a study is suppressed", () => {
  const r = result("strong", [
    insight("generic", {
      classification: "study_experiment",
      lesson: "Warm colours contrast well with cool colours.",
      action: "Warm colours contrast well with cool colours.",
    }),
  ]);
  assert.equal(workspace.workspaceTeaching(r).studies.length, 0);
});
test("a study that only says compare a strength has no changed variable", () =>
  assert.equal(
    language.variableStudy("Compare the warm and cool colour relationship."),
    false,
  ));
test("a real alternative experiment can discuss a successful area", () => {
  const r = result("strong", [
    insight("experiment", {
      classification: "study_experiment",
      lesson: "The quiet background already supports depth.",
      action:
        "Compare softer versus current background edges on scrap; keep the tower fixed and choose the clearer depth.",
    }),
  ]);
  assert.equal(workspace.workspaceTeaching(r).studies.length, 1);
});
test("figure suggestions stay evidenced design studies, never technical defects", () => {
  const r = result("strong", [
    insight("figures", {
      classification: "clear_issue",
      action:
        "On a separate study, add two tiny muted figures below the bank; compare scale with and without them, keeping the tower dominant.",
    }),
  ]);
  const t = workspace.workspaceTeaching(r);
  assert.equal(t.recommendations.length, 0);
  assert.equal(t.studies[0].classification, "study_experiment");
  assert.match(t.studies[0].action, /separate study/);
});
test("figure suggestions without a referenced fact are not presented", () => {
  const r = result("strong", [
    insight("figures", {
      factIds: [],
      action: "Add two figures; compare with and without for human scale.",
    }),
  ]);
  assert.equal(workspace.workspaceTeaching(r).studies.length, 0);
});
test("a figure/no-figure comparison is a design suggestion even without an add imperative", () =>
  assert(
    language.objectDesignSuggestion(
      "In a separate study, compare one tiny muted figure at the lower bank with no figure to assess scale.",
    ),
  ));
test("edge advice near a figure does not invent an object addition", () =>
  assert.equal(
    language.objectDesignSuggestion(
      "Compare softer versus current edges behind the figure for clearer depth.",
    ),
    false,
  ));
test("unrelated technique-domain object insertion is not presented as design advice", () => {
  const r = result("strong", [
    insight("figures", {
      domain: "technique",
      action: "Add two figures; compare with and without for human scale.",
    }),
  ]);
  assert.equal(workspace.workspaceTeaching(r).studies.length, 0);
});
test("stylistic choices are not automatically technical issues", () => {
  const r = fixture();
  r.canonicalAnalysis.insights[2].classification = "clear_issue";
  r.canonicalAnalysis.insights[2].lesson =
    "A muted palette is a valid mood choice.";
  r.canonicalAnalysis.insights[2].action =
    "Compare a cooler alternative on scrap.";
  assert.equal(
    clean(r).canonicalAnalysis.insights[2].classification,
    "optional_refinement",
  );
});
test("atmospheric elevation uses visible evidence without inventing a defect", () => {
  const r = result("strong", [
    insight("atmosphere", {
      domain: "technique",
      factIds: ["edges"],
      lesson:
        "A narrower distant edge range could reinforce the calm atmosphere.",
      action:
        "Compare softer versus current background edges on scrap; keep focal contours fixed and choose the clearer recession.",
    }),
  ]);
  const t = workspace.workspaceTeaching(r);
  assert.equal(t.recommendations.length, 1);
  assert.equal(t.clear.length, 0);
});
for (const claim of [
  "Effective use of wet-on-wet.",
  "Effective use of watercolor layering.",
  "Some areas of wet blending.",
  "Controlled application of glazing.",
  "Controlled glazing gives this passage depth.",
  "The artist layered the colours.",
  "The glazing sequence created depth.",
])
  test(`observed effects do not assert process: ${claim}`, () => {
    assert(evidence.unsupportedProcess(claim));
    assert.equal(evidence.observationText(claim), "");
  });
test("a suggested reproduction technique remains allowed", () => {
  const text =
    "A wet-on-wet exercise could reproduce a similar soft transition on separate paper.";
  assert.equal(evidence.unsupportedProcess(text), false);
  assert.equal(evidence.observationText(text), text);
});
test("visible overlapping colour and crisp accents remain observable evidence", () => {
  const text =
    "Transparent-looking colour overlaps contrast with crisp selected accents.";
  assert.equal(evidence.observationText(text), text);
});
test("warm–cool contrast is not automatically complementary", () => {
  const r = fixture();
  r.canonicalAnalysis.colourAnalysis = colourFixture();
  r.canonicalAnalysis.colourAnalysis.colourStrategy =
    "Use complementary warm and cool colors.";
  assert(
    !/complementary/i.test(
      clean(r).canonicalAnalysis.colourAnalysis.colourStrategy,
    ),
  );
});
test("a named supported complementary pair remains possible", () => {
  const text = "Blue and orange form a complementary relationship.";
  assert.equal(language.colourRelationshipText(text), text);
});
test("opposing chromatic hue evidence can support complementary wording", () => {
  const text = "A near-complementary relationship supports the hierarchy.";
  assert.equal(
    language.colourRelationshipText(text, ["#FF0000", "#00FFFF"]),
    text,
  );
});
test("neutral or near-analogous colours do not support a complementary claim", () => {
  assert(
    !/complementary/.test(
      language.colourRelationshipText("A complementary scheme.", [
        "#777777",
        "#AAAABB",
      ]),
    ),
  );
});
for (const ratio of ["70:30", "80:20", "65:35", "70%:30%", "2.33:1"])
  test(`mix ratio rejects false precision ${ratio}`, () =>
    assert.equal(language.approximateMixRatio(ratio), null));
for (const ratio of ["1:1", "2:1", "3:1"])
  test(`simple approximate recreation ratio ${ratio} remains allowed`, () =>
    assert.equal(language.approximateMixRatio(ratio), ratio));
test("invalid recreation ratio drops independently from useful colour teaching", () => {
  const r = fixture();
  r.canonicalAnalysis.colourAnalysis = colourFixture();
  r.canonicalAnalysis.colourAnalysis.recreationMixes[0].startingRatio = "70:30";
  const v = clean(r);
  assert(v.canonicalAnalysis.colourAnalysis.valueHierarchy);
  assert.equal(
    v.canonicalAnalysis.colourAnalysis.recreationMixes[0].startingRatio,
    null,
  );
});
test("pigment options cannot claim original pigment identity", () => {
  const r = fixture();
  r.canonicalAnalysis.colourAnalysis = colourFixture();
  r.canonicalAnalysis.colourAnalysis.recreationMixes[0].target =
    "Original pigments: Ultramarine";
  assert.equal(
    clean(r).canonicalAnalysis.colourAnalysis.recreationMixes.length,
    1,
  );
});
test("presentation does not mutate canonical roles, geometry or stored classifications", () => {
  const r = result("strong", priorities());
  const before = structuredClone(r);
  workspace.workspaceTeaching(r);
  assert.deepEqual(r, before);
});
test("prompt requests practical elevation and separate experiments inside unchanged provider settings", () => {
  const p = fs
    .readFileSync(
      path.join(__dirname, "../supabase/functions/_shared/prompts.ts"),
      "utf8",
    )
    .split("import type")[0];
  for (const s of [
    "route to a stronger painting",
    "WHAT/WHERE",
    "HOW to test",
    "atmosphere/mood",
    "ONE controlled variable",
    "Warm–cool contrast is NOT automatically complementary",
    "never false percentage precision",
    "Global advice stays global",
  ])
    assert(p.includes(s), s);
  const edge = fs.readFileSync(
    path.join(__dirname, "../supabase/functions/generate-feedback/index.ts"),
    "utf8",
  );
  assert(edge.includes('model: "gpt-4.1-mini"'));
  assert(edge.includes("max_completion_tokens: 3000"));
});
