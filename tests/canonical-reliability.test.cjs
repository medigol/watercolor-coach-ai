const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const fixture = require("./helpers/canonical-fixture.cjs");
const { loadShared } = require("./helpers/shared-loader.cjs");
const painting = loadShared("../shared/paintingAnalysis.ts", "lib/overlays.ts");
function load(file, stubs = {}) {
  const out = {};
  new Function(
    "exports",
    "require",
    ts.transpileModule(
      fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
  )(out, (name) => (name in stubs ? stubs[name] : loadShared(name, file)));
  return out;
}
const notes = load("lib/overlays.ts");
const contract = load("supabase/functions/_shared/contract.ts", {
  "./overlays.ts": notes,
  "./coachingDecision.ts": loadShared(
    "../shared/coachingDecision.ts",
    "lib/overlays.ts",
  ),
});
const clean = (value) => contract.cleanFeedback(value, "improve_painting");
function repaired(raw) {
  const before = structuredClone(raw);
  const value = clean(raw);
  assert.equal(painting.canonicalValidationIssue(value), null);
  assert(contract.validFeedback(value, "improve_painting"));
  assert.deepEqual(
    raw,
    before,
    "repair must not mutate a model or saved document",
  );
  assert.deepEqual(clean(value), value, "repair must be idempotent");
  return value;
}
function secondary(raw, facts = ["path"]) {
  const insight = {
    ...raw.canonicalAnalysis.insights[1],
    id: "extra",
    factIds: facts,
    classification: "optional_refinement",
    lesson: "A connected bank offers a second route to compare.",
    action: "Compare this route in a separate study.",
  };
  raw.canonicalAnalysis.insights.push(insight);
  raw.expertViews.composition.insightIds.push(insight.id);
  return insight;
}

test("exact cross-domain duplicate prose is retained without inventing domain facts", () => {
  const raw = fixture();
  raw.canonicalAnalysis.insights[2].lesson =
    raw.canonicalAnalysis.insights[1].lesson;
  const value = repaired(raw);
  assert.deepEqual(value.canonicalAnalysis.facts, raw.canonicalAnalysis.facts);
  assert.equal(
    value.canonicalAnalysis.insights[2].lesson,
    raw.canonicalAnalysis.insights[1].lesson,
  );
  assert.equal(value.canonicalAnalysis.insights[2].domain, "colour_value");
});
test("near-identical domain lessons remain valid and duplicate optional study prose is suppressed locally", () => {
  const raw = fixture();
  raw.canonicalAnalysis.insights[2].lesson =
    raw.canonicalAnalysis.insights[1].lesson + " Compare it.";
  const extra = secondary(raw);
  extra.lesson = raw.canonicalAnalysis.insights[1].lesson;
  const value = repaired(raw);
  assert.deepEqual(painting.optionalViewInsights(value, "composition"), []);
  assert.equal(
    value.canonicalAnalysis.insights.length,
    raw.canonicalAnalysis.insights.length,
  );
});
test("a developing analysis without strengths stays usable without fabricated praise", () => {
  const raw = fixture();
  raw.canonicalAnalysis.qualityAssessment.level = "developing";
  raw.canonicalAnalysis.insights.forEach(
    (i) => (i.classification = "optional_refinement"),
  );
  const value = repaired(raw);
  assert(
    !value.canonicalAnalysis.insights.some(
      (i) => i.classification === "strength",
    ),
  );
  for (const key of painting.expertViewKeys) {
    const projected = painting.projectPaintingAnalysis(value, key);
    assert.deepEqual(projected.whatWorks, []);
    assert.equal(projected.coachingMode, "constructive");
    assert(projected.mainAdvice);
  }
});
test("cleaning the last hidden corrective strength into a study does not cause a final-gate failure", () => {
  const raw = fixture();
  for (const insight of raw.canonicalAnalysis.insights)
    insight.action = "Compare whether to sharpen an edge in a separate study.";
  const value = repaired(raw);
  assert(
    !value.canonicalAnalysis.insights.some(
      (i) => i.classification === "strength",
    ),
  );
});

for (const key of painting.expertViewKeys) {
  test(`${key}: duplicate, invalid and cross-domain optional view references are filtered`, () => {
    const raw = fixture(),
      view = raw.expertViews[key],
      summary = view.summaryId;
    const other = raw.canonicalAnalysis.insights.find(
      (i) => i.id !== summary,
    ).id;
    view.insightIds = ["missing", summary, summary, other];
    const value = repaired(raw);
    assert.deepEqual(value.expertViews[key].insightIds, [summary]);
    assert.equal(value.expertViews[key].summaryId, summary);
  });
  test(`${key}: an invalid summary falls back only to the first explicitly supplied same-domain insight`, () => {
    const raw = fixture(),
      view = raw.expertViews[key],
      summary = view.summaryId;
    const other = raw.canonicalAnalysis.insights.find(
      (i) => i.id !== summary,
    ).id;
    view.summaryId = other;
    view.insightIds = ["missing", other, summary, summary];
    const value = repaired(raw);
    assert.equal(value.expertViews[key].summaryId, summary);
    assert.deepEqual(value.expertViews[key].insightIds, [summary]);
  });
  test(`${key}: a valid explicitly supplied summary is retained even when absent from insightIds`, () => {
    const raw = fixture(),
      summary = raw.expertViews[key].summaryId;
    raw.expertViews[key].insightIds = ["missing"];
    const value = repaired(raw);
    assert.equal(value.expertViews[key].summaryId, summary);
    assert.deepEqual(value.expertViews[key].insightIds, [summary]);
  });
  test(`${key}: a view with no supplied same-domain material cannot borrow an unsupplied insight`, () => {
    const raw = fixture(),
      summary = raw.expertViews[key].summaryId;
    const other = raw.canonicalAnalysis.insights.find(
      (i) => i.id !== summary,
    ).id;
    raw.expertViews[key].summaryId = "missing";
    raw.expertViews[key].insightIds = [other, "missing"];
    const value = clean(raw);
    assert(!contract.validFeedback(value, "improve_painting"));
    assert.equal(painting.canonicalValidationIssue(value), "view_reference");
  });
}

test("secondary insight references discard bad fact IDs and duplicates while retaining supplied facts", () => {
  const raw = fixture();
  secondary(raw, ["missing", "path", "path"]);
  const value = repaired(raw);
  assert.deepEqual(
    value.canonicalAnalysis.insights.find((i) => i.id === "extra").factIds,
    ["path"],
  );
  assert.deepEqual(value.canonicalAnalysis.facts, raw.canonicalAnalysis.facts);
});
test("a secondary insight without surviving fact references and its optional evidence are omitted", () => {
  const raw = fixture();
  secondary(raw, ["missing"]);
  raw.canonicalAnalysis.visualEvidence.push({
    ...raw.canonicalAnalysis.visualEvidence[0],
    insightId: "extra",
  });
  const value = repaired(raw);
  assert(!value.canonicalAnalysis.insights.some((i) => i.id === "extra"));
  assert.deepEqual(value.expertViews.composition.insightIds, ["design"]);
  assert(
    !value.canonicalAnalysis.visualEvidence.some(
      (e) => e.insightId === "extra",
    ),
  );
});
test("an essential summary without facts stays fatal even when a usable alternative exists", () => {
  const raw = fixture();
  secondary(raw);
  raw.canonicalAnalysis.insights[1].factIds = ["missing"];
  const value = clean(raw);
  assert(!contract.validFeedback(value, "improve_painting"));
  assert.equal(
    painting.canonicalValidationIssue(value),
    "insight_fact_reference",
  );
});
test("an invalid summary cannot fall back to supplied material that has no evidence", () => {
  const raw = fixture();
  raw.expertViews.composition.summaryId = "missing";
  raw.canonicalAnalysis.insights[1].factIds = ["missing"];
  assert(!contract.validFeedback(clean(raw), "improve_painting"));
});
test("an invalid summary skips an unusable secondary and keeps the first supplied evidenced same-domain insight", () => {
  const raw = fixture();
  secondary(raw, ["missing"]);
  raw.expertViews.composition = {
    ...raw.expertViews.composition,
    summaryId: "missing",
    insightIds: ["extra", "design"],
  };
  const value = repaired(raw);
  assert.equal(value.expertViews.composition.summaryId, "design");
  assert.deepEqual(value.expertViews.composition.insightIds, ["design"]);
  assert(!value.canonicalAnalysis.insights.some((i) => i.id === "extra"));
});

test("multiple focal roles use the unique highest explicit confidence, independent of array order", () => {
  const raw = fixture();
  raw.canonicalAnalysis.visualRoles[1].role = "focal";
  raw.canonicalAnalysis.visualRoles.reverse();
  const value = repaired(raw);
  for (const role of value.canonicalAnalysis.visualRoles) {
    const supplied = raw.canonicalAnalysis.visualRoles.find(
      (r) => r.id === role.id,
    );
    assert.deepEqual({ ...role, role: supplied.role }, supplied);
    assert.equal(
      role.role,
      role.id === "tower"
        ? "focal"
        : role.id === "bank"
          ? "supporting"
          : "quiet",
    );
  }
  assert.deepEqual(value.canonicalAnalysis.composition.primary.paths, [
    [
      raw.canonicalAnalysis.composition.primary.paths[0][0],
      raw.canonicalAnalysis.composition.primary.paths[0].at(-1),
    ],
  ]);
});
for (const [name, confidence] of [
  ["tie", 0.92],
  ["missing", undefined],
  ["null", null],
  ["string", "0.9"],
  ["out of range", 2],
  ["nonfinite", NaN],
])
  test(`multiple focal roles with ${name} confidence remain fatal`, () => {
    const raw = fixture();
    Object.assign(raw.canonicalAnalysis.visualRoles[1], {
      role: "focal",
      confidence,
    });
    const value = clean(raw);
    assert(!contract.validFeedback(value, "improve_painting"));
    assert.equal(
      painting.canonicalValidationIssue(value),
      "multiple_focal_roles",
    );
  });

test("repair preserves one Composition Lock and the same role map across all four local views", () => {
  const raw = fixture();
  raw.canonicalAnalysis.visualRoles[1].role = "focal";
  raw.canonicalAnalysis.composition.secondary = {
    ...raw.canonicalAnalysis.composition.primary,
    type: "off_centre",
    paths: null,
  };
  for (const key of painting.expertViewKeys)
    raw.expertViews[key].insightIds.push("missing");
  const value = repaired(raw),
    before = structuredClone(value);
  for (const key of painting.expertViewKeys) {
    const projected = painting.projectPaintingAnalysis(value, key);
    assert.deepEqual(
      projected.coachingDecision.visualRoles,
      value.canonicalAnalysis.visualRoles.map(({ area, role }) => ({
        area,
        role,
      })),
    );
    assert.deepEqual(
      projected.compositionOverlay,
      value.canonicalAnalysis.composition.primary,
    );
    assert.deepEqual(
      projected.secondaryCompositionOverlay,
      value.canonicalAnalysis.composition.secondary,
    );
    assert.deepEqual(projected.coachingDecision.areasToQuiet, ["water"]);
  }
  assert.deepEqual(value, before);
});
test("malformed or omitted optional aids and role visualization fields cannot reject valid core text", () => {
  const raw = fixture();
  const c = raw.canonicalAnalysis;
  delete c.composition.primary;
  c.composition.secondary = { bad: true };
  delete c.visualRoles[0].region;
  delete c.visualRoles[0].confidence;
  c.visualRoles[1].region = { x: 2 };
  c.visualRoles[1].confidence = "unknown";
  c.visualEvidence = [
    null,
    { insightId: "missing", roleId: null, note: {} },
    { insightId: "whole", roleId: "missing", note: {} },
  ];
  c.palette = [{ name: "Bad", hex: "url(bad)", use: "unsafe" }, null];
  c.brushPlan = [{ bad: true }, null];
  const value = repaired(raw).canonicalAnalysis;
  assert.equal(value.composition.primary, null);
  assert.equal(value.composition.secondary, null);
  assert.deepEqual(value.visualEvidence, []);
  assert.equal(value.palette, null);
  assert.equal(value.brushPlan, null);
  assert.equal(value.visualRoles[0].region, null);
  assert.equal(value.visualRoles[0].confidence, null);
  assert.equal(value.visualRoles[1].region, null);
  assert.equal(value.visualRoles[1].confidence, null);
});
test("arbitrary JSON types in optional aid fields are discarded without throwing or rejecting the core", () => {
  for (const bad of [undefined, null, "unknown", 42, [], [null], {}]) {
    const raw = fixture(),
      c = raw.canonicalAnalysis;
    c.composition.primary = bad;
    c.composition.secondary = bad;
    for (const key of ["visualEvidence", "palette", "brushPlan"]) c[key] = bad;
    c.visualRoles[0].region = bad;
    c.visualRoles[0].confidence = bad;
    const value = repaired(raw).canonicalAnalysis;
    assert.equal(value.composition.primary, null);
    assert.equal(value.composition.secondary, null);
    assert.deepEqual(value.visualEvidence, []);
    assert.equal(value.palette, null);
    assert.equal(value.brushPlan, null);
  }
});

for (const [code, mutate] of [
  ["missing_canonical_analysis", (r) => delete r.canonicalAnalysis],
  ["unsupported_version", (r) => (r.canonicalAnalysis.version = 2)],
  [
    "quality_assessment",
    (r) => (r.canonicalAnalysis.qualityAssessment.level = "professional"),
  ],
  [
    "duplicate_role_ids",
    (r) => (r.canonicalAnalysis.visualRoles[1].id = "tower"),
  ],
  [
    "conflicting_roles",
    (r) => (r.canonicalAnalysis.visualRoles[1].area = "tower"),
  ],
  ["fact_reference", (r) => (r.canonicalAnalysis.facts[0].roleId = "missing")],
  [
    "duplicate_fact_ids",
    (r) => (r.canonicalAnalysis.facts[1].id = "hierarchy"),
  ],
  ["missing_facts", (r) => (r.canonicalAnalysis.facts = [])],
  [
    "duplicate_insight_ids",
    (r) => (r.canonicalAnalysis.insights[1].id = "whole"),
  ],
  ["missing_domain_insight", (r) => r.canonicalAnalysis.insights.pop()],
  ["expert_views", (r) => delete r.expertViews.technique],
  ["core_text", (r) => (r.canonicalAnalysis.insights[0].lesson = "")],
  ["composition_structure", (r) => (r.canonicalAnalysis.composition = null)],
])
  test(`private diagnostics identify fatal ${code} without retaining model text`, () => {
    const raw = fixture();
    raw.title = "PRIVATE MODEL TITLE";
    mutate(raw);
    const value = clean(raw);
    assert(!contract.validFeedback(value, "improve_painting"));
    assert.equal(painting.canonicalValidationIssue(value), code);
    assert(!painting.canonicalValidationIssue(value).includes(raw.title));
  });
test("legacy saved feedback and create_reference cleaning/schema remain unchanged", () => {
  const samples = load("data/mockResults.ts");
  for (const [mode, value] of [
    ["improve_painting", samples.improveResult],
    ["create_reference", samples.referenceResult],
  ]) {
    assert.deepEqual(contract.cleanFeedback(value, mode), value);
    assert(contract.validFeedback(value, mode));
    assert(!painting.hasPaintingAnalysis(value));
  }
  assert(!contract.validFeedback(clean(fixture()), "create_reference"));
});

for (const [key, domain, index] of [
  ["colourValue", "colour_value", 2],
  ["technique", "technique", 3],
  ["composition", "composition", 1],
])
  test(`unique ${key} membership and supplied facts repair misplaced domain metadata`, () => {
    const raw = fixture();
    raw.canonicalAnalysis.insights[index].domain = "overall";
    const before = structuredClone(raw);
    const value = repaired(raw);
    assert.equal(value.canonicalAnalysis.insights[index].domain, domain);
    assert.deepEqual(
      value.canonicalAnalysis.insights.map(({ domain, ...i }) => i),
      before.canonicalAnalysis.insights.map(({ domain, ...i }) => i),
    );
    assert.deepEqual(
      value.canonicalAnalysis.facts,
      before.canonicalAnalysis.facts,
    );
  });
test("ambiguous multi-view domain mismatch cannot invent ownership", () => {
  const raw = fixture();
  raw.canonicalAnalysis.insights[2].domain = "overall";
  raw.expertViews.overall.insightIds.push("temperature");
  assert(!contract.validFeedback(clean(raw), "improve_painting"));
});
test("unique view membership without matching fact domains stays fatal", () => {
  const raw = fixture();
  raw.canonicalAnalysis.insights[2].domain = "overall";
  raw.canonicalAnalysis.insights[2].factIds = ["hierarchy"];
  assert(!contract.validFeedback(clean(raw), "improve_painting"));
});
test("mixed-domain facts cannot provide unique domain repair", () => {
  const raw = fixture();
  raw.canonicalAnalysis.insights[2].domain = "overall";
  raw.canonicalAnalysis.insights[2].factIds.push("path");
  assert(!contract.validFeedback(clean(raw), "improve_painting"));
});
test("domain repair does not invent a genuinely absent expert insight", () => {
  const raw = fixture();
  raw.canonicalAnalysis.insights.pop();
  assert.equal(
    painting.canonicalValidationIssue(clean(raw)),
    "missing_domain_insight",
  );
});
function duplicateRole(raw, patch = {}) {
  const role = {
    ...structuredClone(raw.canonicalAnalysis.visualRoles[0]),
    id: "tower-copy",
    area: "  TOWER  ",
    confidence: 0.7,
    ...patch,
  };
  raw.canonicalAnalysis.visualRoles.push(role);
  raw.canonicalAnalysis.facts[0].roleId = role.id;
  raw.canonicalAnalysis.visualEvidence[0].roleId = role.id;
  return role;
}
test("same-area same-role aliases canonicalize and remap fact/evidence IDs", () => {
  const raw = fixture();
  duplicateRole(raw);
  const value = repaired(raw);
  assert.equal(value.canonicalAnalysis.visualRoles.length, 3);
  assert.equal(value.canonicalAnalysis.facts[0].roleId, "tower");
  assert.equal(value.canonicalAnalysis.visualEvidence[0].roleId, "tower");
  assert.deepEqual(
    value.canonicalAnalysis.visualRoles,
    raw.canonicalAnalysis.visualRoles.slice(0, 3),
  );
});
test("duplicate role selection prefers valid geometry before confidence", () => {
  const raw = fixture();
  const supplied = duplicateRole(raw, { confidence: 0.7 });
  raw.canonicalAnalysis.visualRoles[0].region = { x: 2 };
  const value = repaired(raw);
  assert.equal(value.canonicalAnalysis.visualRoles[0].id, supplied.id);
  assert.deepEqual(
    value.canonicalAnalysis.visualRoles[0].region,
    supplied.region,
  );
});
test("duplicate role selection prefers higher confidence with valid geometry", () => {
  const raw = fixture();
  duplicateRole(raw, { confidence: 0.98 });
  const value = repaired(raw);
  assert.equal(value.canonicalAnalysis.visualRoles[0].id, "tower-copy");
});
test("duplicate role selection uses supplied confidence when neither region is usable", () => {
  const raw = fixture();
  duplicateRole(raw, { confidence: 0.98, region: null });
  raw.canonicalAnalysis.visualRoles[0].region = null;
  assert.equal(repaired(raw).canonicalAnalysis.visualRoles[0].id, "tower-copy");
});
test("same-area conflicting roles remain fatal regardless of confidence", () => {
  const raw = fixture();
  duplicateRole(raw, { role: "quiet", confidence: 0.1 });
  assert.equal(
    painting.canonicalValidationIssue(clean(raw)),
    "conflicting_roles",
  );
});
test("equal-confidence aliases with different geometry remain ambiguous and fatal", () => {
  const raw = fixture();
  duplicateRole(raw, {
    confidence: 0.92,
    region: { x: 0.3, y: 0.24, width: 0.2, height: 0.3 },
  });
  assert(!contract.validFeedback(clean(raw), "improve_painting"));
});
test("role alias repair never adds prose or geometry and survives all four projections", () => {
  const raw = fixture();
  duplicateRole(raw);
  const value = repaired(raw);
  assert.deepEqual(
    value.canonicalAnalysis.insights,
    raw.canonicalAnalysis.insights,
  );
  assert.deepEqual(
    value.canonicalAnalysis.facts.map((f) => f.observation),
    raw.canonicalAnalysis.facts.map((f) => f.observation),
  );
  for (const role of value.canonicalAnalysis.visualRoles)
    assert(
      raw.canonicalAnalysis.visualRoles.some(
        (r) => JSON.stringify(r.region) === JSON.stringify(role.region),
      ),
    );
  for (const key of painting.expertViewKeys)
    assert.deepEqual(
      painting.projectPaintingAnalysis(value, key).compositionOverlay,
      value.canonicalAnalysis.composition.primary,
    );
});
test("role aliases remap optional colour IDs without creating a second role map", () => {
  const raw = fixture();
  duplicateRole(raw);
  raw.canonicalAnalysis.colourAnalysis =
    require("./helpers/colour-fixture.cjs")();
  raw.canonicalAnalysis.colourAnalysis.visibleColours[0].roleId = "tower-copy";
  assert.equal(
    repaired(raw).canonicalAnalysis.colourAnalysis.visibleColours[0].roleId,
    "tower",
  );
});
test("a malformed optional colour aid cannot defeat structural domain repair", () => {
  const raw = fixture();
  raw.canonicalAnalysis.insights[2].domain = "overall";
  raw.canonicalAnalysis.colourAnalysis = {
    visibleColours: [null],
    valueHierarchy: {},
  };
  raw.canonicalAnalysis.visualEvidence = [
    null,
    { note: { region: { x: 20 } } },
  ];
  raw.canonicalAnalysis.brushPlan = [null];
  raw.canonicalAnalysis.composition.secondary = { type: "unknown" };
  const value = repaired(raw).canonicalAnalysis;
  assert.equal(value.colourAnalysis, null);
  assert.deepEqual(value.visualEvidence, []);
  assert.equal(value.brushPlan, null);
  assert.equal(value.composition.secondary, null);
});
