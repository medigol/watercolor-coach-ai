const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/provider-draft-fixture.cjs");
const canonicalFixture = require("./helpers/canonical-fixture.cjs");
const provider = loadShared(
  "../shared/providerPaintingAnalysis.ts",
  "lib/overlays.ts",
);
const painting = loadShared("../shared/paintingAnalysis.ts", "lib/overlays.ts");
const { workspaceTeaching } = loadShared(
  "../shared/coachingWorkspace.ts",
  "lib/overlays.ts",
);
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

// Original, supplied technical-scene teaching. No live images/provider calls.
const rationale =
  "The pale tower remains distinct from the connected middle values around it. Warm light against cool water reinforces that focal separation without extra detail. The rising bank supplies direction while the broad water keeps the scene calm. These relationships give the painting coherent hierarchy and atmosphere, so no significant correction is needed.";
const practice =
  "On a separate 15-minute study, paint two small versions of the tower and its surrounding water. Vary only the value contrast between those shapes; keep edges, colour and placement constant. Compare which version gives the tower a clearer landing without making the water compete. Success means the pale focal shape reads first while the connected middle values remain subordinate.";

function normalized(raw) {
  const before = structuredClone(raw);
  const result = provider.normalizeProviderPaintingAnalysis(raw);
  assert(result.ok, JSON.stringify(result));
  const clean = painting.cleanPaintingAnalysis(
    result.result,
    overlays.usableOverlays,
  );
  assert(
    painting.validPaintingAnalysis(clean),
    JSON.stringify(painting.canonicalValidationIssue(clean)),
  );
  assert.deepEqual(raw, before, "text normalization does not mutate the draft");
  return clean;
}

test("analysis depth: only rationale and practice text bounds expand in the existing schemas", () => {
  const aids = {
    structure: { type: ["object", "null"] },
    overlay: { type: ["array", "null"] },
    brush: { type: ["array", "null"] },
  };
  const draft = provider.providerPaintingAnalysisSchema(aids);
  const saved = painting.paintingAnalysisSchema(aids);
  assert.equal(
    draft.properties.qualityAssessment.properties.rationale.maxLength,
    640,
  );
  assert.equal(
    saved.properties.canonicalAnalysis.properties.qualityAssessment.properties
      .rationale.maxLength,
    640,
  );
  assert.equal(draft.$defs.fact.properties.observation.maxLength, 240);
  assert.equal(draft.$defs.insight.properties.lesson.maxLength, 240);
  assert.equal(draft.$defs.insight.properties.action.maxLength, 180);
  assert.equal(
    draft.properties.compositionStructure.properties.observation.maxLength,
    240,
  );
  assert.equal(
    draft.properties.colourValue.properties.colourAnalysis.properties
      .colourStrategy.maxLength,
    180,
  );
  for (const key of painting.expertViewKeys) {
    assert.equal(draft.properties[key].properties.practice.maxLength, 640);
    assert.equal(
      saved.properties.expertViews.properties[key].properties.practice
        .maxLength,
      640,
    );
  }
});

test("analysis depth: four complete rationale sentences survive normalization and display", () => {
  const raw = fixture();
  raw.qualityAssessment.rationale = rationale;
  assert(rationale.length > 240 && rationale.length <= 640);
  const saved = normalized(raw);
  const teaching = workspaceTeaching(saved);
  assert.equal(saved.canonicalAnalysis.version, 1);
  assert.equal(saved.canonicalAnalysis.qualityAssessment.rationale, rationale);
  assert.equal(teaching.assessment.rationale, rationale);
  assert.equal(teaching.assessment.level, "highly_resolved");
  assert.deepEqual(teaching.recommendations, []);
});

test("analysis depth: longer study retains task, variable, constant, comparison and success cue", () => {
  const raw = fixture();
  raw.overall.practice = practice;
  assert(practice.length > 240 && practice.length <= 640);
  const saved = normalized(raw);
  const teaching = workspaceTeaching(saved);
  assert.equal(saved.expertViews.overall.practice, practice);
  assert.equal(teaching.practice, practice);
  assert.match(teaching.practice, /^On a separate 15-minute study/);
  assert.match(teaching.practice, /Vary only the value contrast/);
  assert.match(teaching.practice, /keep edges, colour and placement constant/);
  assert.match(teaching.practice, /Compare which version/);
  assert.match(teaching.practice, /Success means/);
});

test("analysis depth: rationale 640-character boundary is accepted by provider and canonical gates", () => {
  const raw = fixture();
  raw.qualityAssessment.rationale = `${"A".repeat(639)}.`;
  const saved = normalized(raw);
  assert.equal(saved.canonicalAnalysis.qualityAssessment.rationale.length, 640);
});

test("analysis depth: rationale beyond 640 remains a fixed provider validation failure", () => {
  const raw = fixture();
  raw.qualityAssessment.rationale = `${"A".repeat(640)}.`;
  assert.deepEqual(provider.normalizeProviderPaintingAnalysis(raw), {
    ok: false,
    reason: "provider_structure",
  });
});

test("analysis depth: saved rationale beyond 640 remains invalid", () => {
  const raw = canonicalFixture();
  raw.canonicalAnalysis.qualityAssessment.rationale = `${"A".repeat(640)}.`;
  assert.equal(painting.canonicalValidationIssue(raw), "quality_assessment");
});

for (const key of painting.expertViewKeys) {
  test(`analysis depth: ${key} practice accepts 640 and omits 641 without a core failure`, () => {
    const raw = fixture();
    raw[key].practice = `${"A".repeat(639)}.`;
    assert.equal(normalized(raw).expertViews[key].practice.length, 640);
    raw[key].practice = `${"A".repeat(640)}.`;
    assert.equal(normalized(raw).expertViews[key].practice, "");
  });
  test(`analysis depth: saved ${key} practice still has a bounded validation gate`, () => {
    const raw = canonicalFixture();
    raw.expertViews[key].practice = `${"A".repeat(639)}.`;
    assert.equal(painting.canonicalValidationIssue(raw), null);
    raw.expertViews[key].practice = `${"A".repeat(640)}.`;
    assert.equal(painting.canonicalValidationIssue(raw), "expert_views");
  });
}

test("analysis depth: old short saved documents remain valid and deterministic", () => {
  const raw = fixture();
  const first = normalized(raw);
  const second = normalized(raw);
  assert.deepEqual(first, second);
  assert.equal(first.canonicalAnalysis.version, 1);
  assert.deepEqual(
    first.canonicalAnalysis.insights.map((i) => [i.id, i.factIds]),
    second.canonicalAnalysis.insights.map((i) => [i.id, i.factIds]),
  );
  assert.deepEqual(
    first.canonicalAnalysis.composition,
    second.canonicalAnalysis.composition,
  );
  assert.deepEqual(
    first.canonicalAnalysis.visualRoles,
    second.canonicalAnalysis.visualRoles,
  );
});
