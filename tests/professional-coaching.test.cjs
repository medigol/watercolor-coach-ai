const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/canonical-fixture.cjs"),
  colourFixture = require("./helpers/colour-fixture.cjs");
const painting = loadShared("../shared/paintingAnalysis.ts", "lib/overlays.ts");
const teaching = loadShared(
  "../shared/coachingWorkspace.ts",
  "lib/overlays.ts",
);
const archetypes = loadShared("../shared/visualMetadata.ts", "lib/overlays.ts");
const notes = {};
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
)(notes, (name) => loadShared(name, "lib/overlays.ts"));
const clean = (r) => painting.cleanPaintingAnalysis(r, notes.usableOverlays);
test("upload has one analysis CTA and no focus choice or sample painting", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../app/upload/improve-painting.tsx"),
    "utf8",
  );
  assert(source.includes('title="Analyse painting"'));
  assert(source.includes('focus="Overall feedback"'));
  assert(
    !/accessibilityRole="radio"|Which view|sample painting|Lake House|setFocus/.test(
      source,
    ),
  );
});
for (const [level, expected] of [
  ["highly_resolved", "No significant correction"],
  ["strong", "No major issue detected"],
  ["competent", "Review the observed"],
  ["developing", "Review the observed"],
])
  test(`${level}: deterministic status without invented defects`, () => {
    const r = fixture();
    r.canonicalAnalysis.qualityAssessment.level = level;
    assert(teaching.workspaceTeaching(clean(r)).status.startsWith(expected));
  });
test("competent meaningful opportunity never receives no-correction language", () => {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment.level = "competent";
  r.canonicalAnalysis.insights[2].classification = "optional_refinement";
  r.canonicalAnalysis.insights[2].action =
    "In a separate study, compare a quieter bank shadow against the reserved tower light.";
  r.canonicalAnalysis.facts[2].observation =
    "The fragmented bank shadow competes with the tower and weakens spatial integration.";
  r.canonicalAnalysis.insights[2].lesson =
    "The fragmented bank shadow weakens spatial integration around the tower light.";
  const v = teaching.workspaceTeaching(clean(r));
  assert(v.opportunity);
  assert.match(v.status, /Main opportunity/);
  assert(!/No significant|No major/.test(v.status));
});
test("a preservation note alone is not promoted into a competent painting's main opportunity", () => {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment.level = "competent";
  r.canonicalAnalysis.insights[2].classification = "optional_refinement";
  const result = teaching.workspaceTeaching(clean(r));
  assert.equal(result.opportunity, undefined);
  assert(!result.status.includes("Main opportunity"));
});
test("developing material issue is prioritised rather than hidden by praise", () => {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment.level = "developing";
  r.canonicalAnalysis.facts[2].observation =
    "Scattered dark water-shadow marks compete with the tower light and weaken readability.";
  Object.assign(r.canonicalAnalysis.insights[2], {
    classification: "clear_issue",
    lesson: "Scattered dark marks interrupt value grouping.",
    action: "In a separate study, compare one connected shadow.",
  });
  const v = teaching.workspaceTeaching(clean(r));
  assert.equal(v.status, "Main priority");
  assert.equal(v.clear.length, 1);
});
for (const action of [
  "Sharpen the bank.",
  "The warm light works; increase the contrast on the bank.",
  "The sky is effective. Soften the bank.",
])
  test(`strength teaching rejects corrective imperatives: ${action}`, () => {
    const r = fixture();
    r.canonicalAnalysis.insights[1].lesson = action;
    const v = clean(r);
    assert.notEqual(v.canonicalAnalysis.insights[1].classification, "strength");
    assert(
      !teaching.workspaceTeaching(v).strengths.some((i) => i.id === "design"),
    );
  });
test("practice may be absent without making the core invalid or fabricating an exercise", () => {
  const r = fixture();
  Object.values(r.expertViews).forEach((v) => (v.practice = ""));
  const v = clean(r);
  assert(painting.validPaintingAnalysis(v));
  assert.equal(teaching.workspaceTeaching(v).practice, "");
});
test("practice is not copied from a strength and studies remain bounded", () => {
  const r = fixture();
  Object.values(r.expertViews).forEach(
    (v) => (v.practice = r.canonicalAnalysis.insights[0].lesson),
  );
  const v = teaching.workspaceTeaching(clean(r));
  assert.equal(v.practice, "");
  assert(v.studies.length <= 2);
});
test("compact colour extension preserves version, canonical roles, facts and composition", () => {
  const r = fixture();
  r.canonicalAnalysis.colourAnalysis = colourFixture();
  const baseline = clean(fixture()),
    v = clean(r);
  assert(painting.validPaintingAnalysis(v));
  assert.equal(v.canonicalAnalysis.version, 1);
  assert.deepEqual(
    v.canonicalAnalysis.visualRoles,
    baseline.canonicalAnalysis.visualRoles,
  );
  assert.deepEqual(
    v.canonicalAnalysis.composition,
    baseline.canonicalAnalysis.composition,
  );
  assert.deepEqual(v.canonicalAnalysis.facts, r.canonicalAnalysis.facts);
  assert.deepEqual(v.canonicalAnalysis.colourAnalysis, colourFixture());
  assert.deepEqual(clean(v), v);
});
for (const bad of [
  null,
  "bad",
  {},
  [],
  { valueHierarchy: "The artist used Cerulean Blue." },
])
  test(`malformed optional colour analysis is nonfatal: ${JSON.stringify(bad)}`, () => {
    const r = fixture();
    r.canonicalAnalysis.colourAnalysis = bad;
    const v = clean(r);
    assert(painting.validPaintingAnalysis(v));
    assert.equal(v.canonicalAnalysis.colourAnalysis, null);
  });
test("colour swatches bind to existing canonical roles, never introduce a new role map", () => {
  const r = fixture();
  r.canonicalAnalysis.colourAnalysis = colourFixture();
  r.canonicalAnalysis.colourAnalysis.visibleColours[0].roleId = "invented";
  const v = clean(r);
  assert.equal(v.canonicalAnalysis.colourAnalysis.visibleColours.length, 2);
  assert.equal(v.canonicalAnalysis.visualRoles[1].role, "supporting");
});
test("supporting accents cannot become competing focal instructions in colour guidance", () => {
  const r = fixture();
  r.canonicalAnalysis.colourAnalysis = colourFixture();
  r.canonicalAnalysis.colourAnalysis.chromaHierarchy =
    "Increase contrast on the bank.";
  const v = clean(r);
  assert.equal(v.canonicalAnalysis.colourAnalysis.chromaHierarchy, "");
  assert.equal(v.canonicalAnalysis.visualRoles[1].role, "supporting");
});
test("an unsupported colour defect is dropped, while an unusual coherent palette is allowed", () => {
  const r = fixture();
  r.canonicalAnalysis.colourAnalysis = colourFixture();
  r.canonicalAnalysis.colourAnalysis.technicalAssessment.kind = "issue";
  const v = clean(r);
  assert.equal(v.canonicalAnalysis.colourAnalysis.technicalAssessment, null);
  const creative = fixture();
  creative.canonicalAnalysis.colourAnalysis = colourFixture();
  creative.canonicalAnalysis.colourAnalysis.colourStrategy =
    "An unusual muted violet and ochre field creates a coherent temperature relationship.";
  assert(
    clean(creative).canonicalAnalysis.colourAnalysis.colourStrategy.includes(
      "unusual",
    ),
  );
});
for (const claim of [
  "The artist used Cerulean Blue.",
  "This was painted with Burnt Sienna.",
  "The original pigment is Ultramarine.",
])
  test(`original-pigment certainty is not shown: ${claim}`, () => {
    const r = fixture();
    r.canonicalAnalysis.colourAnalysis = colourFixture();
    r.canonicalAnalysis.colourAnalysis.colourStrategy = claim;
    assert.equal(clean(r).canonicalAnalysis.colourAnalysis.colourStrategy, "");
  });
test("colour UI distinguishes visible image colours, possible recreation pigments and approximate ratios", () => {
  const ui = fs
    .readFileSync(
      path.join(__dirname, "../components/ColourValueAnalysis.tsx"),
      "utf8",
    )
    .replace(/\s+/g, " ");
  assert(ui.includes("Visible colour evidence"));
  assert(ui.includes("not original pigment identification"));
  assert(ui.includes("Possible watercolor pigments"));
  assert(ui.includes("Approximate starting ratio"));
  assert(ui.includes("Brand, paper, pigment strength"));
  assert(!ui.includes("Suggested palette"));
});
test("optional colour guidance cannot infer the painter's identity or experience", () => {
  for (const claim of [
    "You are a professional artist.",
    "This was painted by a famous artist.",
    "The artist is an expert.",
  ]) {
    const r = fixture();
    r.canonicalAnalysis.colourAnalysis = colourFixture();
    r.canonicalAnalysis.colourAnalysis.colourStrategy = claim;
    assert.equal(clean(r).canonicalAnalysis.colourAnalysis.colourStrategy, "");
  }
});
test("unified workspace contains no model/service writes, view tabs or palette duplication", () => {
  const ui = fs.readFileSync(
    path.join(__dirname, "../components/PaintingAnalysisWorkspace.tsx"),
    "utf8",
  );
  assert(
    !/fetch\s*\(|functions\.invoke|\.rpc\(|\.storage\.|expert-view-controls|Show Overall guidance|PaletteCard/.test(
      ui,
    ),
  );
  for (const title of [
    "Complete Painting Analysis",
    "Composition",
    "Colour & Value",
    "Watercolor technique",
    "Practice & Studies",
  ])
    assert(ui.includes(title));
});
test("canonical prompt requests calibrated strengths, specific practice and compact colour in the original budget", () => {
  const prompt = fs
    .readFileSync(
      path.join(__dirname, "../supabase/functions/_shared/prompts.ts"),
      "utf8",
    )
    .split("import type")[0];
  assert(prompt.includes("never fabricate them"));
  assert(prompt.includes("controlled variable"));
  assert(prompt.includes("TechnicalAssessment"));
  assert(prompt.includes("palette null"));
  assert(prompt.includes("legacy palette field must be null"));
  assert(!prompt.includes("palette is null or 3–4"));
  assert(prompt.includes("3000 tokens"));
  const entry = fs.readFileSync(
    path.join(__dirname, "../supabase/functions/generate-feedback/index.ts"),
    "utf8",
  );
  assert(entry.includes('model: "gpt-4.1-mini"'));
  assert(entry.includes("max_completion_tokens: 3000"));
});
