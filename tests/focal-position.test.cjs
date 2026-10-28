const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { loadShared } = require("./helpers/shared-loader.cjs");
const { coarseFocalPosition, neutralizeFocalPositionText } = loadShared(
  "../shared/focalPosition.ts",
  __filename,
);

// The library and helper must remain pure: this loader permits local TS only,
// with no browser, provider, storage, network or database dependencies.
const root = path.resolve(__dirname, "..");
const cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", "require", code)(exports, (name) => {
    assert(name.startsWith("."), `Unexpected I/O-capable dependency: ${name}`);
    let dependency = path.resolve(path.dirname(file), name);
    if (!path.extname(dependency)) dependency += ".ts";
    assert(dependency.startsWith(root + path.sep));
    return load(dependency);
  });
  return exports;
}
const {
  archetypeLabel,
  compositionTeachingRows,
  createCompositionStructurePlan,
} = load("lib/compositionArchetypes.ts");

const focal = (x = 0.5, y = 0.5, confidence = 0.9) => ({
  role: "focal",
  region: { x: x - 0.05, y: y - 0.05, width: 0.1, height: 0.1 },
  confidence,
});
const composition = (x = 0.5, y = 0.5, confidence = 0.9) => ({
  type: "off_centre",
  confidence,
  shortExplanation: "The central focal point anchors the surrounding shapes.",
  paths: null,
  focalPoint: { x, y },
  secondaryPoints: null,
  masses: null,
});

test("a confident canonical focal role supplies coarse central placement", () => {
  assert.equal(coarseFocalPosition([focal()]), "central");
});

test("a confidently lower-right focal region is clearly off-centre", () => {
  assert.equal(coarseFocalPosition([focal(0.8, 0.78)]), "off_centre");
});

test("confident saved focalPoint is usable without a focal role region", () => {
  assert.equal(coarseFocalPosition([], composition()), "central");
  assert.equal(coarseFocalPosition([], composition(0.8, 0.78)), "off_centre");
});

test("position confidence uses the existing inclusive .65 geometry threshold", () => {
  assert.equal(coarseFocalPosition([focal(0.5, 0.5, 0.65)]), "central");
  assert.equal(coarseFocalPosition([focal(0.5, 0.5, 0.649)]), "uncertain");
  assert.equal(
    coarseFocalPosition([], composition(0.5, 0.5, 0.649)),
    "uncertain",
  );
});

test("missing, malformed and non-finite geometry retain uncertain placement", () => {
  assert.equal(coarseFocalPosition(undefined), "uncertain");
  for (const role of [
    { ...focal(), region: null },
    { ...focal(), region: { x: 0.9, y: 0.5, width: 0.3, height: 0.1 } },
    { ...focal(), confidence: null },
    { ...focal(), confidence: Number.NaN },
    { ...focal(), confidence: 1.1 },
  ])
    assert.equal(coarseFocalPosition([role]), "uncertain");
  assert.equal(
    coarseFocalPosition([], { confidence: 0.9, focalPoint: { x: 4, y: 0.5 } }),
    "uncertain",
  );
});

test("supporting and quiet geometry cannot establish focal placement", () => {
  assert.equal(
    coarseFocalPosition([
      { ...focal(), role: "supporting" },
      { ...focal(), role: "quiet" },
    ]),
    "uncertain",
  );
});

test("the documented .12/.22 dead-band avoids precise threshold claims", () => {
  for (const [x, expected] of [
    [0.38, "central"],
    [0.62, "central"],
    [0.37, "uncertain"],
    [0.63, "uncertain"],
    [0.67, "uncertain"],
    [0.28, "off_centre"],
    [0.72, "off_centre"],
  ])
    assert.equal(coarseFocalPosition([], composition(x)), expected, String(x));
  assert.equal(coarseFocalPosition([], composition(0.5, 0.67)), "uncertain");
  assert.equal(coarseFocalPosition([], composition(0.5, 0.8)), "off_centre");
});

test("conflicting role and composition positions remain neutral", () => {
  assert.equal(
    coarseFocalPosition([focal()], composition(0.8, 0.78)),
    "uncertain",
  );
  assert.equal(
    coarseFocalPosition([focal(0.8, 0.78)], composition()),
    "uncertain",
  );
  assert.equal(coarseFocalPosition([focal(0.65)], composition()), "uncertain");
});

test("ambiguous competing focal role positions cannot manufacture certainty", () => {
  assert.equal(coarseFocalPosition([focal(), focal(0.8, 0.78)]), "uncertain");
});

test("agreement between existing role and focalPoint retains coarse placement", () => {
  assert.equal(coarseFocalPosition([focal()], composition(0.55)), "central");
});

test("weak optional role geometry does not block a confident saved focalPoint", () => {
  assert.equal(
    coarseFocalPosition([focal(0.8, 0.78, 0.3)], composition()),
    "central",
  );
});

test("a central focal region does not expose an Off-centre focus label", () => {
  assert.equal(archetypeLabel("off_centre", "central"), "Focal placement");
  assert.equal(archetypeLabel("off_centre", "uncertain"), "Focal placement");
  assert.equal(archetypeLabel("off_centre", "off_centre"), "Off-centre focus");
});

test("clearly off-centre geometry removes central focal claims", () => {
  assert.equal(
    neutralizeFocalPositionText("Central vertical focus", "off_centre"),
    "Vertical focus",
  );
  assert.equal(
    neutralizeFocalPositionText(
      "The central boat focal point anchors the bands.",
      "off_centre",
    ),
    "The boat focal point anchors the bands.",
  );
  assert.equal(
    neutralizeFocalPositionText(
      "Van centrally placed against the mountain.",
      "off_centre",
    ),
    "Van placed against the mountain.",
  );
});

test("uncertain geometry neutralizes both central and off-centre claims", () => {
  assert.equal(
    neutralizeFocalPositionText("Off-centre focus", "uncertain"),
    "Focus",
  );
  assert.equal(
    neutralizeFocalPositionText("Central focal point", "uncertain"),
    "Focal point",
  );
  assert.equal(
    neutralizeFocalPositionText("The boat is at the centre.", "uncertain"),
    "The boat is within the image.",
  );
});

test("compatible supplied positional wording remains unchanged", () => {
  assert.equal(
    neutralizeFocalPositionText("Central focal point", "central"),
    "Central focal point",
  );
  assert.equal(
    neutralizeFocalPositionText("Off-centre focus", "off_centre"),
    "Off-centre focus",
  );
});

test("neutralized subject-placement sentences remain complete", () => {
  assert.equal(
    neutralizeFocalPositionText(
      "The boat is positioned off-centre.",
      "central",
    ),
    "The boat is positioned within the image.",
  );
  assert.equal(
    neutralizeFocalPositionText("Off-centered focus", "uncertain"),
    "Focus",
  );
});

test("position cleaning does not rewrite an unrelated central shadow or colour region", () => {
  const observation =
    "The central shadow and central colour region are broad and calm.";
  assert.equal(
    neutralizeFocalPositionText(observation, "off_centre"),
    observation,
  );
  const principle = "Central placement is not inherently a defect.";
  assert.equal(neutralizeFocalPositionText(principle, "uncertain"), principle);
});

for (const subject of ["steeple", "spire"])
  test(`architectural ${subject} placement follows the same supplied geometry as tower`, () => {
    assert.equal(
      neutralizeFocalPositionText(
        `The central ${subject} anchors the scene.`,
        "off_centre",
      ),
      `The ${subject} anchors the scene.`,
    );
    assert.equal(
      neutralizeFocalPositionText(
        `The ${subject} is positioned off-centre.`,
        "central",
      ),
      `The ${subject} is positioned within the image.`,
    );
    assert.equal(
      neutralizeFocalPositionText(`Central focal ${subject}`, "uncertain"),
      `Focal ${subject}`,
    );
  });

test("architectural aliases preserve compatible placement and unrelated central features", () => {
  for (const [text, position] of [
    ["The central steeple anchors the scene.", "central"],
    ["The off-centre spire anchors the scene.", "off_centre"],
    ["The central shadow lies beneath the steeple.", "off_centre"],
    ["A central nave and symmetrical windows support the spire.", "uncertain"],
  ])
    assert.equal(neutralizeFocalPositionText(text, position), text);
});

for (const apostrophe of ["'", "’"])
  test(`possessive focal placement with ${apostrophe} obeys supplied geometry`, () => {
    // Sanitized word form from a verified saved-result excerpt; not a complete
    // production record, subject diagnosis or replacement geometry.
    const text = `The steeple${apostrophe}s central placement balances the shapes.`;
    for (const position of ["off_centre", "uncertain"])
      assert.equal(
        neutralizeFocalPositionText(text, position),
        `The steeple${apostrophe}s placement balances the shapes.`,
      );
    assert.equal(neutralizeFocalPositionText(text, "central"), text);
    assert.equal(
      neutralizeFocalPositionText(
        `The spire${apostrophe}s off-centre position balances the shapes.`,
        "central",
      ),
      `The spire${apostrophe}s position balances the shapes.`,
    );
  });

test("possessive placement cleanup preserves other properties and compatible alternatives", () => {
  for (const [text, position] of [
    ["The steeple's central shadow is dark.", "off_centre"],
    ["The tower’s central colour region is broad.", "uncertain"],
    ["The spire’s off-centre position balances the shapes.", "off_centre"],
    ["Compare central placement with off-centre placement in a separate study.", "uncertain"],
  ])
    assert.equal(neutralizeFocalPositionText(text, position), text);
});

test("structure plan neutralizes an off-centre label without inferring another archetype", () => {
  const input = composition();
  const before = structuredClone(input);
  const plan = createCompositionStructurePlan(input);
  assert.equal(plan.label, "Focal placement");
  assert.equal(plan.type, "off_centre");
  assert.equal(plan.thirdsGrid, false);
  assert.deepEqual(plan.anchors, [{ point: input.focalPoint, role: "focal" }]);
  assert.deepEqual(plan.strokes, []);
  assert.deepEqual(input, before);
});

test("off-centre text is corrected without moving existing composition geometry", () => {
  const input = composition(0.8, 0.78);
  const before = structuredClone(input);
  const plan = createCompositionStructurePlan(input);
  assert.equal(
    plan.explanation,
    "The focal point anchors the surrounding shapes.",
  );
  assert.equal(plan.label, "Off-centre focus");
  assert.deepEqual(plan.anchors[0].point, before.focalPoint);
  assert.deepEqual(input, before);
});

test("a neutral position context preserves supported archetype-specific teaching and geometry", () => {
  for (const type of [
    "diagonal",
    "s_curve",
    "l_shape",
    "u_frame",
    "cross",
    "radiating",
    "balanced_masses",
    "steelyard",
    "triangle",
    "rule_of_thirds",
  ]) {
    assert.equal(archetypeLabel(type, "uncertain"), archetypeLabel(type));
  }
  const overlay = {
    ...composition(0.8, 0.78),
    type: "diagonal",
    paths: [
      [
        { x: 0.1, y: 0.9 },
        { x: 0.8, y: 0.78 },
      ],
    ],
    teaching: {
      elements: ["Road", "Boat"],
      entry: "The road enters at the foreground.",
      path: "It supports the central boat focal point.",
      landing: "Central focal point",
      supportingMass: null,
      quietMass: null,
      counterbalance: null,
      risk: null,
    },
  };
  const before = structuredClone(overlay);
  const rows = compositionTeachingRows(overlay);
  assert.deepEqual(
    rows.map(([label]) => label),
    ["Visible elements", "Entry", "Path", "Landing"],
  );
  assert.equal(rows[2][1], "It supports the boat focal point.");
  assert.equal(rows[3][1], "Focal point");
  assert.deepEqual(overlay, before);
});
