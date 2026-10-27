const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(file) {
  const resolved = path.resolve(root, file);
  if (cache.has(resolved)) return cache.get(resolved);
  const exports = {};
  cache.set(resolved, exports);
  const code = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", "require", code)(exports, (name) => {
    assert(name.startsWith("."), `Unexpected non-local import: ${name}`);
    let dependency = path.resolve(path.dirname(resolved), name);
    if (!path.extname(dependency)) dependency += ".ts";
    return load(dependency);
  });
  return exports;
}
const { displayRoleProjection, planCanonicalVisualRoles } =
  load("lib/visualRoles.ts");
const { projectPaintingAnalysis } = load("shared/paintingAnalysis.ts");
const { insightEvidence, colourEvidence } = load("lib/teachingEvidence.ts");
function fixture(area, observation) {
  const source = require("./helpers/canonical-fixture.cjs")();
  const c = source.canonicalAnalysis;
  c.visualRoles[2] = { ...c.visualRoles[2], id: "field", area };
  c.facts.push({
    id: "field_fact",
    roleId: "field",
    domain: "technique",
    observation,
  });
  c.insights.push({
    id: "field_insight",
    domain: "technique",
    classification: "strength",
    factIds: ["field_fact"],
    lesson:
      "The observed lower-field relationship supports the focal hierarchy.",
    action: "Preserve its relationship with the focal group.",
  });
  c.visualEvidence.push({
    insightId: "field_insight",
    roleId: "field",
    note: {
      ...c.visualEvidence[0].note,
      id: "field_note",
      visualRole: "quiet",
      label: "Quiet foreground",
      region: c.visualRoles[2].region,
      shortInstruction: "Observe this quiet foreground role.",
    },
  });
  return source;
}
function display(source) {
  const before = structuredClone(source);
  const result = displayRoleProjection(source.canonicalAnalysis);
  assert.deepEqual(source, before, "canonical result must remain unchanged");
  return {
    ...source,
    canonicalAnalysis: {
      ...source.canonicalAnalysis,
      visualRoles: result.visualRoles,
      visualEvidence: result.visualEvidence,
    },
  };
}
for (const [area, observation] of [
  ["road", "The road leads the eye toward the focal tower."],
  ["street", "The street has strong perspective lines toward the tower."],
  ["path", "The path is a directional lead-in for the focal group."],
  ["foreground", "The foreground forms a major dark value mass."],
  [
    "lower field",
    "The foreground carries significant visual flow toward the focal group.",
  ],
  [
    "low-contrast road",
    "The low-contrast road is a strong path through the scene.",
  ],
  [
    "subdued road",
    "The low-contrast road carries the eye toward the focal tower.",
  ],
])
  test(`structurally active ${area} is omitted from the displayed Quiet role map and list`, () => {
    const source = fixture(area, observation);
    const projected = display(source);
    assert(
      !projected.canonicalAnalysis.visualRoles.some((r) => r.id === "field"),
    );
    assert(
      !planCanonicalVisualRoles(projected.canonicalAnalysis.visualRoles).some(
        (r) => r.role === "quiet",
      ),
    );
    assert.equal(source.canonicalAnalysis.visualRoles[2].role, "quiet");
  });
test("non-focal or ambiguous road wording alone cannot substantiate a Quiet assignment", () => {
  for (const observation of [
    "The road occupies the foreground.",
    "The foreground surrounds the focal object.",
    "A street crosses the lower image.",
  ]) {
    const projected = display(fixture("Quiet road", observation));
    assert(
      !projected.canonicalAnalysis.visualRoles.some((r) => r.id === "field"),
    );
  }
});
test("explicitly low-information and subordinate road/foreground can remain Quiet", () => {
  for (const [area, observation] of [
    ["road", "The road is a quiet low-contrast passage with little detail."],
    [
      "foreground",
      "The foreground remains visually subordinate with few marks.",
    ],
    ["path", "The path has low-information colour and minimal texture."],
  ]) {
    const source = fixture(area, observation);
    const projected = display(source);
    assert.deepEqual(
      projected.canonicalAnalysis.visualRoles,
      source.canonicalAnalysis.visualRoles,
    );
    assert.equal(
      planCanonicalVisualRoles(projected.canonicalAnalysis.visualRoles)[2].role,
      "quiet",
    );
    assert.deepEqual(
      projected.canonicalAnalysis.visualEvidence,
      source.canonicalAnalysis.visualEvidence,
    );
  }
});
test("a quiet adjective does not override supplied active road structure", () => {
  const projected = display(
    fixture(
      "quiet road",
      "The road stays low contrast but is a directional lead-in toward the tower.",
    ),
  );
  assert(
    !projected.canonicalAnalysis.visualRoles.some((r) => r.id === "field"),
  );
});

test("an active path linked to another role does not alone invalidate a supplied quiet segment", () => {
  const source = fixture(
    "lower foreground road",
    "The lower foreground road remains low-contrast with few marks.",
  );
  source.canonicalAnalysis.facts.push({
    id: "separate_active_path",
    domain: "composition",
    roleId: source.canonicalAnalysis.visualRoles[1].id,
    observation: "The upper path guides the eye toward the focal group.",
  });
  const projected = display(source);
  assert(projected.canonicalAnalysis.visualRoles.some((r) => r.id === "field"));
  assert.deepEqual(
    projected.canonicalAnalysis.visualEvidence,
    source.canonicalAnalysis.visualEvidence,
  );
});
test("quiet omission never fabricates Supporting or moves canonical geometry", () => {
  const source = fixture(
    "foreground",
    "The foreground is a strong value mass.",
  );
  const projected = display(source);
  assert.deepEqual(
    projected.canonicalAnalysis.visualRoles,
    source.canonicalAnalysis.visualRoles.slice(0, 2),
  );
  assert.equal(
    projected.canonicalAnalysis.visualRoles.filter(
      (r) => r.role === "supporting",
    ).length,
    1,
  );
  assert.equal(
    projected.canonicalAnalysis.visualRoles[0],
    source.canonicalAnalysis.visualRoles[0],
  );
  assert.equal(
    projected.canonicalAnalysis.visualRoles[1],
    source.canonicalAnalysis.visualRoles[1],
  );
  assert.deepEqual(
    projected.canonicalAnalysis.composition,
    source.canonicalAnalysis.composition,
  );
});
test("linked Quiet notes/crops are omitted without deleting the original advice or unrelated evidence", () => {
  const source = fixture("road", "The road leads the eye toward the tower.");
  const projected = display(source);
  assert.deepEqual(
    projected.canonicalAnalysis.insights,
    source.canonicalAnalysis.insights,
  );
  assert.deepEqual(
    projected.canonicalAnalysis.facts,
    source.canonicalAnalysis.facts,
  );
  assert.deepEqual(projected.canonicalAnalysis.visualEvidence, [
    source.canonicalAnalysis.visualEvidence[0],
  ]);
  const notes = projectPaintingAnalysis(projected, "overall").overlays;
  assert(!notes.some((n) => n.id === "field_note" || n.visualRole === "quiet"));
  assert(notes.some((n) => n.id === "roof"));
  const advice = source.canonicalAnalysis.insights.at(-1);
  const evidence = insightEvidence(projected, advice);
  assert.equal(
    evidence.kind,
    "whole",
    "missing role geometry falls back to original whole-image evidence",
  );
  assert.equal(evidence.noteId, undefined);
  assert.equal(colourEvidence(projected, "field", "Lower-field colour"), null);
});
test("an explicit legacy Quiet annotation with null role reference is removed only through matching canonical fact links", () => {
  const source = fixture("path", "The path is a directional lead-in.");
  source.canonicalAnalysis.visualEvidence[1].roleId = null;
  source.canonicalAnalysis.visualEvidence.push({
    insightId: "whole",
    roleId: null,
    note: {
      ...source.canonicalAnalysis.visualEvidence[0].note,
      id: "unrelated",
      label: "Quiet surroundings",
    },
  });
  const projected = display(source);
  assert.deepEqual(
    projected.canonicalAnalysis.visualEvidence.map((e) => e.note.id),
    ["roof", "unrelated"],
  );
});
test("a legacy Quiet annotation with an absent role reference still cannot orphan its fact-linked Quiet marker", () => {
  const source = fixture(
    "street",
    "The low-contrast street carries the eye toward the focal tower.",
  );
  delete source.canonicalAnalysis.visualEvidence[1].roleId;
  const projected = display(source);
  assert.deepEqual(
    projected.canonicalAnalysis.visualEvidence.map((e) => e.note.id),
    ["roof"],
  );
});
test("non-targeted quiet fields and canonical Focal/Supporting roles remain unchanged", () => {
  const source = require("./helpers/canonical-fixture.cjs")();
  const projected = display(source);
  assert.deepEqual(
    projected.canonicalAnalysis.visualRoles,
    source.canonicalAnalysis.visualRoles,
  );
  assert.deepEqual(
    projected.canonicalAnalysis.visualEvidence,
    source.canonicalAnalysis.visualEvidence,
  );
});
test("workspace applies one read-only role projection to labels, overlays, notes, crops and colour role labels", () => {
  const source = fs.readFileSync(
    path.join(root, "components/PaintingAnalysisWorkspace.tsx"),
    "utf8",
  );
  assert(source.includes("const c = displaySource.canonicalAnalysis"));
  assert(source.includes("displayRoleProjection("));
  assert(source.includes("planCanonicalVisualRoles(c.visualRoles)"));
  assert(source.includes("{c.visualRoles.map((r) => ("));
  assert(source.includes("source={displaySource}"));
  assert.match(source, /const evidenceSource = useMemo\([\s\S]*?\.\.\.displaySource,[\s\S]*?visualEvidence: c\.visualEvidence\?\.filter/);
  for (const file of ["lib/visualRoles.ts"]) {
    const code = fs.readFileSync(path.join(root, file), "utf8");
    assert(
      !/fetch\s*\(|functions\.invoke|\.upload\s*\(|\.rpc\s*\(|\.insert\s*\(/.test(
        code,
      ),
    );
  }
});
