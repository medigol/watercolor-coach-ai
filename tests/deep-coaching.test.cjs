const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const { loadShared } = require("./helpers/shared-loader.cjs");
const raw = require("./helpers/deep-coaching-fixture.cjs");
const provider = loadShared(
    "../shared/providerPaintingAnalysis.ts",
    "lib/overlays.ts",
  ),
  painting = loadShared("../shared/paintingAnalysis.ts", "lib/overlays.ts"),
  workspace = loadShared("../shared/coachingWorkspace.ts", "lib/overlays.ts");
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
)(overlays, (n) => loadShared(n, "lib/overlays.ts"));
function result(level) {
  const v = provider.normalizeProviderPaintingAnalysis(raw(level));
  assert(v.ok);
  const r = painting.cleanPaintingAnalysis(v.result, overlays.usableOverlays);
  assert(painting.validPaintingAnalysis(r));
  return r;
}
test("deep Strong result keeps four distinct relationship lessons, no invented corrections", () => {
  const t = workspace.workspaceTeaching(result("strong"));
  assert.equal(t.assessment.level, "strong");
  assert.equal(t.strengths.length, 4);
  assert.equal(t.recommendations.length, 0);
  for (const s of t.strengths) {
    assert(s.factIds.length);
    assert(s.lesson.length > 100);
    assert.match(s.action, /Preserve/);
  }
});
test("Strong with no major issue retains one meaningful optional controlled-variable practice", () => {
  const t = workspace.workspaceTeaching(result("strong"));
  assert.match(t.status, /No major issue/);
  for (const word of [
    "separate",
    "15-minute",
    "two versions",
    "fixed",
    "vary only",
    "Compare",
    "arm’s length",
    "edge hierarchy",
  ])
    assert(t.practice.includes(word), word);
  assert.equal(t.studies.length, 0);
  assert(!/\b(?:fix|accuracy|improve|defect)\b/.test(t.practice));
});
test("Developing retains the supplied material relationship and actionable main priority", () => {
  const t = workspace.workspaceTeaching(result("developing"));
  assert.equal(t.assessment.level, "developing");
  assert(
    t.recommendations.some(
      (r) => r.label === "Main opportunity" && /bank/.test(r.insight.action),
    ),
  );
  assert.match(t.recommendations[0].insight.lesson, /compete|flatten/);
  assert.match(t.recommendations[0].insight.action, /separate study/);
});
test("no evidence-supported supplied exercise means no fabricated study", () => {
  const r = result("strong");
  Object.values(r.expertViews).forEach((v) => (v.practice = ""));
  const t = workspace.workspaceTeaching(r);
  assert.equal(t.practice, "");
  assert.equal(t.studies.length, 0);
});
test("deeper accepted draft preserves v1 and one shared composition geometry in all four projections", () => {
  const r = result("strong"),
    before = structuredClone(r);
  for (const key of painting.expertViewKeys) {
    const p = painting.projectPaintingAnalysis(r, key);
    assert.deepEqual(
      p.compositionOverlay,
      r.canonicalAnalysis.composition.primary,
    );
  }
  workspace.workspaceTeaching(r);
  assert.deepEqual(r, before);
  assert.equal(r.canonicalAnalysis.version, 1);
});
test("observed technique remains visible result; future methods stay separate", () => {
  const t = workspace.workspaceTeaching(result("strong"));
  const technique = t.strengths.find((i) => i.domain === "technique");
  assert(technique);
  assert.match(technique.lesson, /crisp|soft/);
  assert(
    !/painted with|brushwork|wet-on-wet|wash application/.test(
      technique.lesson,
    ),
  );
});
test("provider instructions request richer bounded teaching and neutral study without minimum essay", () => {
  const s = fs.readFileSync(
    path.join(__dirname, "../supabase/functions/_shared/prompts.ts"),
    "utf8",
  );
  for (const words of [
    "2–4 DISTINCT",
    "0–3 justified",
    "ONE OPTIONAL neutral",
    "TWO versions",
    "visible success cue",
    "350–650",
    "no minimum",
    "3000 tokens",
  ])
    assert(s.includes(words), words);
});
test("deeper technical fixture reports useful prose and serialized overhead, not paid token measurement", () => {
  const r = raw(),
    prose = [];
  function walk(x, k = "") {
    if (
      typeof x === "string" &&
      ["observation", "lesson", "action", "rationale", "practice"].includes(k)
    )
      prose.push(x);
    else if (x && typeof x === "object")
      Object.entries(x).forEach(([key, v]) => walk(v, key));
  }
  walk(r);
  const words = prose.join(" ").split(/\s+/).length;
  assert(words >= 350 && words <= 650, `${words} words`);
  assert(JSON.stringify(r).length < 12500);
});
