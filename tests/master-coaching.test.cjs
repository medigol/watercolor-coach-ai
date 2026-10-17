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

test("production competent refinement is shown without requiring a defect", () => {
  const t = workspace.workspaceTeaching(
    result("competent", [
      insight("integration", {
        lesson: "The separate bands weaken the connected spatial field.",
        action:
          "On scrap, connect adjacent band values; compare whether the boat sits within the surrounding space.",
      }),
    ]),
  );
  assert.equal(t.recommendations[0].label, "Main opportunity");
  assert.equal(
    t.recommendations[0].insight.classification,
    "optional_refinement",
  );
});
test("a supplied integration instruction need not say increase/reduce to be a useful priority", () => {
  const r = result("competent", [
    insight("connect", {
      lesson: "Disconnected bands weaken the common spatial field.",
      action: "Connect the middle-ground value bands on scrap paper.",
    }),
  ]);
  assert.equal(
    workspace.workspaceTeaching(r).recommendations[0].insight.id,
    "connect",
  );
});
test("removing empty repeated study framing cannot crash presentation", () => {
  assert.equal(language.separateStudyText("; in a small study"), "");
});
for (const classification of ["clear_issue", "optional_refinement"])
  test(`central placement alone is a study alternative even if labelled ${classification}`, () => {
    const r = result("competent", [
      insight("position", {
        classification,
        lesson: "Central placement risks a static feel.",
        action: "Move the focal tower off-centre in a separate study.",
      }),
    ]);
    const v = clean(r);
    assert.equal(
      v.canonicalAnalysis.insights.at(-1).classification,
      "stylistic_alternative",
    );
    const t = workspace.workspaceTeaching(v);
    assert.equal(t.recommendations.length, 0);
    assert(t.studies.some((i) => i.id === "position"));
  });
test("positive central-placement strength remains allowed", () => {
  const r = result();
  r.canonicalAnalysis.insights[0].lesson =
    "Central placement works with unequal supporting masses.";
  assert.equal(
    clean(r).canonicalAnalysis.insights[0].classification,
    "strength",
  );
});
test("concrete supplied placement harm can still support a correction", () => {
  assert.equal(
    language.unsupportedPlacementAdvice(
      "Move the focal tower off-centre.",
      "The tower overlaps the bank and obscures its silhouette.",
    ),
    false,
  );
});
test("unrelated background competition does not prove central-placement harm", () => {
  assert.equal(
    language.unsupportedPlacementAdvice(
      "Move the central van off-centre.",
      "Mountain darks compete with the focal vehicle.",
    ),
    true,
  );
});
test("a specific leading refinement retains the main priority above generic issue wording", () => {
  const r = result("strong", [
    insight("generic-issue", {
      classification: "clear_issue",
      lesson: "The pattern needs more clarity.",
      action: "Increase contrast.",
    }),
    insight("specific-elevation", {
      lesson: "Background darks compete with the tower.",
      action: "Compress background values on scrap; compare focal separation.",
    }),
  ]);
  const t = workspace.workspaceTeaching(r);
  assert.equal(t.recommendations[0].insight.id, "specific-elevation");
  assert.equal(t.recommendations[0].label, "Main opportunity");
});
test("specific background/focal relationship outranks positioning taste and generic contrast", () => {
  const r = result("competent", [
    insight("position", {
      lesson: "Central placement risks a static feel.",
      action: "Move the focal tower off-centre.",
    }),
    insight("generic", {
      lesson: "The scene could use more contrast.",
      action: "Increase contrast.",
    }),
    insight("specific", {
      lesson: "Background dark accents compete with the focal tower.",
      action: "Compress background values on scrap; compare focal separation.",
    }),
  ]);
  r.expertViews.overall.summaryId = "generic";
  const t = workspace.workspaceTeaching(r);
  assert.equal(t.recommendations[0].insight.id, "specific");
  assert(!t.recommendations.some((i) => i.insight.id === "position"));
});
test("What works omits exercise action and keeps the supplied successful observation", () => {
  const r = result();
  r.canonicalAnalysis.insights[0].action =
    "On scrap paper, paint two values and compare which version holds the focal light.";
  const t = workspace.workspaceTeaching(clean(r));
  const strength = t.strengths.find((i) => i.id === "whole");
  assert(strength);
  assert.equal(strength.action, "");
  assert(!/scrap|paint two/.test(strength.lesson));
});
for (const imperative of [
  "Use a soft edge.",
  "Paint a study.",
  "Try a different wash.",
  "Practice the focal contrast.",
])
  test(`imperative Strength uses existing fact rather than instructions: ${imperative}`, () => {
    const r = result();
    r.canonicalAnalysis.insights[0].lesson = imperative;
    const t = workspace.workspaceTeaching(r);
    assert.equal(
      t.strengths[0].lesson,
      r.canonicalAnalysis.facts[0].observation,
    );
  });
test("an exercise supplied on a Strength can be owned by Practice", () => {
  const r = result();
  Object.values(r.expertViews).forEach((v) => (v.practice = ""));
  r.canonicalAnalysis.insights[0].action =
    "On scrap paper, paint two value versions; compare which gives clearer focal separation.";
  const t = workspace.workspaceTeaching(r);
  assert.equal(t.strengths[0].action, "");
  assert.match(t.practice, /^On scrap paper/);
});
for (const trailing of [
  "Minor refinements could enhance spatial clarity.",
  "Some edges could be refined.",
  "A few areas might benefit from softer contours.",
])
  test(`quality rationale omits separate critique: ${trailing}`, () => {
    assert.equal(
      language.qualityRationaleText(
        `Coherent light and clear hierarchy create strong depth. ${trailing}`,
      ),
      "Coherent light and clear hierarchy create strong depth.",
    );
  });
test("positive quality evidence is retained after omitted optional criticism", () => {
  assert.equal(
    language.qualityRationaleText(
      "Clear shapes create depth. Minor refinements could improve edges. Unequal masses maintain balance.",
    ),
    "Clear shapes create depth. Unequal masses maintain balance.",
  );
});
for (const text of [
  "On a separate small study, test softening shadow edges in a small study; compare current and softer edges.",
  "Test softer background edges in a small study on scrap paper; compare the depth.",
  "On scrap watercolor paper, compare background values in a separate study.",
])
  test(`study framing occurs once: ${text.slice(0, 25)}`, () => {
    const safe = language.separateStudyText(text);
    assert.equal(
      (
        safe.match(
          /(?:on|in) (?:a )?(?:separate |small )*study|on scrap(?: watercolor)? paper/gi,
        ) || []
      ).length,
      1,
    );
    assert.match(safe, /compare/i);
    assert.equal(language.separateStudyText(safe), safe);
  });
for (const [raw, expected] of [
  [
    "The wash application is controlled with transparent layering.",
    "Visible colour passages have transparent-looking overlaps.",
  ],
  [
    "Watercolor washes are applied loosely with some layering and soft blending.",
    "Visible colour passages appear loose, with overlapping colour and soft blended transitions.",
  ],
])
  test(`production process assertion becomes a supplied visible effect: ${raw.slice(0, 30)}`, () => {
    assert.equal(evidence.observationText(raw), expected);
    const r = result();
    r.canonicalAnalysis.facts[3].observation = raw;
    r.canonicalAnalysis.insights[3].lesson = raw;
    r.canonicalAnalysis.insights[3].action = raw;
    r.canonicalAnalysis.qualityAssessment.rationale = raw;
    const v = clean(r);
    assert(painting.validPaintingAnalysis(v));
    assert.equal(v.canonicalAnalysis.facts[3].observation, expected);
    assert.equal(v.canonicalAnalysis.insights[3].lesson, expected);
    assert.equal(v.canonicalAnalysis.insights[3].action, expected);
    assert.equal(v.canonicalAnalysis.qualityAssessment.rationale, expected);
  });
test("horizontal layering of colour bands is a valid observable structure", () => {
  const text = "Horizontal layering of colour bands divides the spatial field.";
  assert.equal(evidence.observationText(text), text);
});
test("suggested wet-on-wet method stays allowed after process sanitization", () => {
  const text = "A wet-on-wet study could reproduce similar softness.";
  assert.equal(evidence.observationText(text), text);
});
for (const pigment of ["white", "Titanium White", "Chinese white", "PW6"])
  test(`transparent recreation does not prescribe ${pigment}`, () => {
    const r = result();
    r.canonicalAnalysis.colourAnalysis = colourFixture();
    r.canonicalAnalysis.colourAnalysis.recreationMixes[0].pigments.push(
      pigment,
    );
    const mixes = clean(r).canonicalAnalysis.colourAnalysis.recreationMixes;
    assert.equal(mixes.length, 1);
    assert.equal(mixes[0].startingRatio, "3:1");
  });
test("an explicitly labelled opaque gouache variation may use white", () => {
  const r = result();
  r.canonicalAnalysis.colourAnalysis = colourFixture();
  const mix = r.canonicalAnalysis.colourAnalysis.recreationMixes[0];
  mix.pigments.push("Titanium White");
  mix.use = "For an opaque gouache variation, test the pale mix on scrap.";
  assert.equal(
    clean(r).canonicalAnalysis.colourAnalysis.recreationMixes.length,
    2,
  );
});
// These presentation tests supply the visible problem as a real linked fact;
// lessons/actions alone may no longer manufacture their own evidence.
const suppliedEvidence = {
  integration:
    "Disconnected middle-ground water bands isolate the boat, weakening spatial integration.",
  connect:
    "Disconnected middle-ground value bands weaken the connected spatial field around the boat.",
  "generic-issue":
    "The surrounding value masses have weak contrast and unclear separation.",
  "specific-elevation":
    "Background dark accents compete with the tower's focal contrast.",
  generic:
    "The surrounding value masses have weak contrast and unclear separation.",
  specific: "Background dark accents compete with the tower's focal contrast.",
  elevate:
    "Numerous small bank marks compete with the tower's focal hierarchy.",
  small: "Numerous small bank marks compete with the tower's focal hierarchy.",
  value:
    "Internal distant mountain darks compete with focal contrast and flatten recession.",
  duplicate:
    "Internal distant mountain darks compete with focal contrast and flatten recession.",
  edges: "Sharp upper background contours flatten spatial recession.",
  rhythm:
    "Repeated foreground marks crowd the open water with excessive repetition.",
  detail: "Numerous small wires create visual noise across the reserved sky.",
  atmosphere:
    "Sharp internal background edges limit atmospheric recession beside the focal contours.",
};
function result(level = "competent", items = []) {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment.level = level;
  for (const item of items) {
    const observation = suppliedEvidence[item.id];
    if (
      observation &&
      ["clear_issue", "optional_refinement"].includes(item.classification)
    ) {
      const id = `supplied-${item.id}`;
      r.canonicalAnalysis.facts.push({
        id,
        domain: item.domain,
        observation,
        roleId: null,
      });
      r.canonicalAnalysis.insights.push({ ...item, factIds: [id] });
    } else r.canonicalAnalysis.insights.push(item);
  }
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
  "Controlled application of glazing.",
  "Controlled glazing gives this passage depth.",
  "The artist layered the colours.",
  "The glazing sequence created depth.",
])
  test(`observed effects do not assert process: ${claim}`, () => {
    assert(evidence.unsupportedProcess(claim));
    assert.equal(evidence.observationText(claim), "");
  });
test("wet blending retains only its supplied visible transition", () => {
  const claim = "Some areas of wet blending.";
  assert(evidence.unsupportedProcess(claim));
  const observed = evidence.observationText(claim);
  assert.equal(observed, "Some soft blended colour transitions.");
  assert.equal(evidence.unsupportedProcess(observed), false);
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
