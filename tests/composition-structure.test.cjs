const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const modules = new Map();

function element(tag) {
  return ({
    children,
    accessible,
    accessibilityRole,
    accessibilityLabel,
    pointerEvents,
    testID,
    style,
    ...props
  }) =>
    React.createElement(
      tag,
      {
        ...props,
        role: accessibilityRole,
        "aria-label": accessibilityLabel,
        "data-testid": testID,
        style,
      },
      children,
    );
}
const mocks = {
  "react/jsx-runtime": require("react/jsx-runtime"),
  "react-native": { View: element("div") },
  "react-native-svg": Object.fromEntries(
    [
      ["default", "svg"],
      ["Circle", "circle"],
      ["G", "g"],
      ["Line", "line"],
      ["Path", "path"],
      ["Polygon", "polygon"],
    ].map(([name, tag]) => [name, element(tag)]),
  ),
};
function load(file) {
  const resolved = path.resolve(root, file);
  if (modules.has(resolved)) return modules.get(resolved);
  const exports = {};
  modules.set(resolved, exports);
  const code = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", "require", code)(exports, (name) => {
    if (name in mocks) return mocks[name];
    assert(name.startsWith("."), `Unexpected import: ${name}`);
    let dependency = path.resolve(path.dirname(resolved), name);
    if (!path.extname(dependency)) dependency += ".ts";
    return load(dependency);
  });
  return exports;
}
const geometry = load("lib/imageGeometry.ts");
const metadata = load("shared/visualMetadata.ts");
const library = load("lib/compositionArchetypes.ts");
const Component = load("components/CompositionStructure.tsx").default;
const p = (x, y) => ({ x, y });
const first = p(0.1, 0.8),
  middle = p(0.4, 0.6),
  last = p(0.75, 0.2);
const triangle = [p(0.15, 0.8), p(0.45, 0.2), p(0.8, 0.75)];
const mass = (points, role = "supporting") => ({ points, role });
const fixture = (patch = {}) => ({
  type: "diagonal",
  confidence: 0.9,
  shortExplanation: "The shoreline leads toward the small focal building.",
  paths: [[first, last]],
  focalPoint: last,
  secondaryPoints: null,
  masses: null,
  ...patch,
});
const render = (
  overlay,
  frame = { x: 0, y: 0, width: 400, height: 300, scale: 1 },
) => renderToStaticMarkup(React.createElement(Component, { overlay, frame }));

test("original archetype vocabulary has no scene assets or predetermined image coordinates", () => {
  assert.equal(library.compositionArchetypeIds.length, 17);
  assert.deepEqual(
    new Set(library.compositionArchetypeIds),
    new Set(metadata.compositionArchetypes),
  );
  for (const [id, entry] of Object.entries(library.compositionArchetypes)) {
    assert.equal(library.archetypeLabel(id), entry.label);
    assert(entry.label.length > 3 && entry.principle.length > 25);
    assert.deepEqual(Object.keys(entry).sort(), ["label", "principle"]);
  }
  assert.equal(library.archetypeLabel("mixed"), "Mixed structure");
});

test("diagonal uses only saved image-specific geometry, not a library template", () => {
  const plan = library.createCompositionStructurePlan(fixture());
  assert.deepEqual(plan.strokes, [
    { points: [first, last], closed: false, smooth: false },
  ]);
  assert.deepEqual(plan.anchors, [
    { point: last, role: "focal" },
    { point: first, role: "supporting" },
  ]);
  assert.equal(plan.thirdsGrid, false);
  const shifted = fixture({ paths: [[p(0.3, 0.1), p(0.9, 0.5)]] });
  assert.notDeepEqual(
    library.createCompositionStructurePlan(shifted).strokes,
    plan.strokes,
  );
  const html = render(fixture());
  assert(html.includes('d="M40 240 L300 60"'));
  assert(!html.includes("<img"));
});

test("curved structure rounds only supplied path anchors and does not close a flow path", () => {
  const overlay = fixture({ type: "s_curve", paths: [[first, middle, last]] });
  const plan = library.createCompositionStructurePlan(overlay);
  assert.deepEqual(plan.strokes[0].points, [first, middle, last]);
  assert.equal(plan.strokes[0].smooth, true);
  const html = render(overlay);
  assert(html.includes('d="M40 240 Q160 180 230 120 L300 60"'));
});

test("triangle joins meaningful supplied anchors or follows a supplied polygon", () => {
  const anchors = fixture({
    type: "triangle",
    paths: null,
    focalPoint: triangle[0],
    secondaryPoints: triangle.slice(1),
  });
  const anchorPlan = library.createCompositionStructurePlan(anchors);
  assert.deepEqual(anchorPlan.strokes, [
    { points: triangle, closed: true, smooth: false },
  ]);
  assert(render(anchors).includes('d="M60 240 L180 60 L320 225 Z"'));
  const pathPlan = library.createCompositionStructurePlan(
    fixture({
      type: "triangle",
      paths: [[first, last], triangle],
    }),
  );
  assert.equal(pathPlan.strokes.length, 1);
  assert.deepEqual(pathPlan.strokes[0].points, triangle);
  const collinearFirstThree = library.createCompositionStructurePlan(
    fixture({
      type: "triangle",
      paths: null,
      focalPoint: p(0.1, 0.2),
      secondaryPoints: [p(0.2, 0.2), p(0.3, 0.2), p(0.4, 0.6)],
    }),
  );
  assert(geometry.validPolygon(collinearFirstThree.strokes[0].points));
});

test("thirds grid requires a confident saved focal point and has no default focal placement", () => {
  assert.equal(
    library.createCompositionStructurePlan(
      fixture({
        type: "rule_of_thirds",
        focalPoint: null,
      }),
    ),
    null,
  );
  const overlay = fixture({ type: "rule_of_thirds", paths: null });
  const plan = library.createCompositionStructurePlan(overlay);
  assert.equal(plan.thirdsGrid, true);
  assert.deepEqual(plan.anchors[0].point, last);
  const html = render(overlay);
  // Four geometry lines, each with a narrow pale halo for light/dark paintings.
  assert.equal((html.match(/<line\b/g) ?? []).length, 8);
  const gridLines = html.match(/<line\b[^>]+>/g) ?? [];
  assert.equal(new Set(gridLines).size, 4);
  assert(html.includes('cx="300" cy="60"'));
});

test("named archetypes use supplied paths, anchors, and masses without new generic illustrations", () => {
  const supporting = mass([p(0.1, 0.1), p(0.35, 0.2), p(0.2, 0.5)]);
  const focal = mass([p(0.65, 0.6), p(0.9, 0.6), p(0.9, 0.9)], "focal");
  const paths = [
    [first, middle, last, p(0.9, 0.75)],
    [p(0.2, 0.3), p(0.85, 0.5)],
  ];
  for (const id of library.compositionArchetypeIds.filter(
    (id) => id !== "none",
  )) {
    const overlay = fixture({
      type: id,
      paths,
      focalPoint: triangle[0],
      secondaryPoints: triangle.slice(1),
      masses: [supporting, focal],
    });
    const plan = library.createCompositionStructurePlan(overlay);
    assert(plan, id);
    assert.equal(plan.type, id);
    assert.equal(plan.explanation, overlay.shortExplanation);
    assert(
      render(overlay).includes(
        `Composition overlay: ${library.archetypeLabel(id)}.`,
      ),
    );
  }
});

test("none, weak confidence and incomplete geometry preserve text without drawing a false formula", () => {
  for (const overlay of [
    fixture({ type: "none" }),
    fixture({ confidence: 0.64 }),
    fixture({
      type: "triangle",
      paths: [[first, last]],
      secondaryPoints: null,
    }),
    fixture({ type: "cross", paths: [[first, last]] }),
    fixture({ type: "s_curve", paths: [[first, last]] }),
    fixture({ paths: [[p(1.2, 0.5), last]] }),
  ]) {
    const usable = metadata.usableCompositionOverlay(overlay);
    assert.equal(usable.shortExplanation, overlay.shortExplanation);
    assert.equal(library.createCompositionStructurePlan(overlay), null);
    assert.equal(render(overlay), "");
  }
  assert.equal(render(undefined), "");
  assert.equal(render({}), "");
});

test("mixed structure displays saved neutral geometry but never invents a dominant formula", () => {
  const overlay = fixture({ type: "mixed" });
  const plan = library.createCompositionStructurePlan(overlay);
  assert.equal(plan.label, "Mixed structure");
  assert.equal(plan.thirdsGrid, false);
  assert.deepEqual(plan.strokes[0].points, [first, last]);
  assert.equal(
    library.createCompositionStructurePlan(
      fixture({
        type: "mixed",
        paths: null,
        focalPoint: null,
      }),
    ),
    null,
  );
});

test("malformed optional geometry is dropped individually while valid saved geometry still renders", () => {
  const overlay = fixture({
    paths: [
      [first, last],
      [{ x: 10, y: 0.4 }, last],
    ],
    secondaryPoints: [middle, { x: 0.2, y: Number.NaN }],
    masses: [{ points: [first, last] }, mass(triangle, "quiet")],
  });
  const plan = library.createCompositionStructurePlan(overlay);
  assert.equal(plan.strokes.length, 1);
  assert.equal(plan.masses.length, 0); // Unrelated quiet polygon is not the diagonal lesson.
  assert.equal(plan.anchors.length, 2);
  assert.equal(plan.explanation, overlay.shortExplanation);
  assert(!render(overlay).includes("NaN"));
});
test("a current diagonal teaches one path and landing, without unrelated grids or polygons", () => {
  const plan = library.createCompositionStructurePlan(
    fixture({
      paths: [
        [first, last],
        [middle, last],
        [first, middle],
      ],
      secondaryPoints: [middle, first],
      masses: [
        mass(triangle, "quiet"),
        mass(triangle, "supporting"),
        mass(triangle, "focal"),
      ],
    }),
  );
  assert.equal(plan.strokes.length, 1);
  assert.equal(plan.anchors.length, 2);
  assert.equal(plan.masses.length, 1);
  assert.equal(plan.masses[0].role, "supporting");
  assert.equal(plan.thirdsGrid, false);
});

test("overlay and source frame share projection across source ratios and browser sizes", () => {
  for (const source of [
    { width: 1200, height: 900 },
    { width: 900, height: 1200 },
    { width: 1000, height: 1000 },
    { width: 1800, height: 600 },
  ])
    for (const width of [320, 375, 1440]) {
      const frame = geometry.containFrame(source, { width, height: 420 });
      const global = geometry.projectPoint(last, frame);
      const local = geometry.projectPoint(last, { ...frame, x: 0, y: 0 });
      assert.equal(local.x + frame.x, global.x);
      assert.equal(local.y + frame.y, global.y);
      const html = render(fixture(), frame);
      assert(html.includes(`viewBox="0 0 ${frame.width} ${frame.height}"`));
      assert(html.includes(`cx="${local.x}" cy="${local.y}"`));
      assert(html.includes(`left:${frame.x}${frame.x ? "px" : ""}`));
      assert(html.includes(`top:${frame.y}${frame.y ? "px" : ""}`));
    }
});

test("wrapper describes current image structure while SVG graphics are decorative and non-interactive", () => {
  const html = render(fixture());
  assert(html.includes('role="image"'));
  assert(
    html.includes(
      'aria-label="Composition overlay: Diagonal movement. The shoreline leads toward the small focal building."',
    ),
  );
  assert(html.includes('aria-hidden="true"'));
  assert(!html.includes("<text"));
  assert(!/Generated|new image|exact copy|AI painting/.test(html));
  for (const file of [
    "lib/compositionArchetypes.ts",
    "components/CompositionStructure.tsx",
  ]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert(
      !/fetch\s*\(|functions\.invoke|api\.openai|canvas|process\.env|https?:|<Image\b|<img\b/.test(
        source,
      ),
      file,
    );
  }
});

for (const type of [
  "balanced_masses",
  "steelyard",
  "enclosure",
  "triangle",
  "three_spot",
  "rhythm",
])
  test(`${type}: teaching labels omit irrelevant directional Entry/Path/Landing`, () => {
    const overlay = fixture({
      type,
      teaching: {
        elements: ["Tower", "Bank"],
        entry: "Bottom left",
        path: "Across the water",
        landing: "Tower",
        supportingMass: "Muted bank",
        quietMass: "Open water",
        counterbalance: "Bank balances tower",
        risk: null,
      },
    });
    const rows = library.compositionTeachingRows(overlay);
    assert(
      !rows.some(([label]) => ["Entry", "Path", "Landing"].includes(label)),
    );
    if (["balanced_masses", "steelyard"].includes(type))
      assert(rows.some(([label]) => label === "Negative space"));
  });
test("balance diagram connects supplied masses without inventing an eye-flow route", () => {
  const overlay = fixture({
    type: "balanced_masses",
    paths: null,
    masses: [
      mass(triangle, "focal"),
      mass([p(0.05, 0.6), p(0.3, 0.65), p(0.15, 0.9)], "supporting"),
    ],
  });
  const plan = library.createCompositionStructurePlan(overlay);
  assert.equal(plan.balanceAxis.length, 2);
  assert.equal(plan.strokes.length, 0);
  assert.equal(plan.thirdsGrid, false);
  assert.equal(plan.masses.length, 2);
});
test("a triangle template uses three non-collinear supplied anchors even if extra points were saved", () => {
  const supplied = [p(0.1, 0.8), p(0.3, 0.8), p(0.6, 0.8), p(0.7, 0.2)];
  const overlay = fixture({ type: "triangle", paths: [supplied] });
  const plan = library.createCompositionStructurePlan(overlay);
  assert.equal(plan.strokes[0].points.length, 3);
  assert(
    plan.strokes[0].points.every(
      (point) =>
        supplied.includes(point) ||
        supplied.some((p) => p.x === point.x && p.y === point.y),
    ),
  );
  assert.equal(plan.strokes[0].closed, true);
  assert.deepEqual(
    overlay.paths,
    [supplied],
    "rendering cannot mutate saved geometry",
  );
});

const teaching = (patch = {}) => ({
  elements: ["Tower", "Bank"],
  entry: "Lower left bank",
  path: "Bank toward tower",
  landing: "Pale tower",
  supportingMass: "Muted bank",
  quietMass: "Open water",
  counterbalance: "Bank balances tower",
  risk: "Keep the tower dominant",
  ...patch,
});
const directionalLabels = ["Entry", "Path", "Landing"];
const hasDirectionalRows = (rows) =>
  rows.some(([label]) => directionalLabels.includes(label));
const nonDirectionalStudies = [
  {
    type: "u_frame",
    paths: [[p(0.1, 0.2), p(0.1, 0.8), p(0.9, 0.8), p(0.9, 0.2)]],
    relationship: "Side trees frame the open water around the tower",
    label: "Framing relationship",
    elementsLabel: "Framing elements",
  },
  {
    type: "cross",
    paths: [
      [p(0.4, 0.1), p(0.4, 0.9)],
      [p(0.1, 0.6), p(0.9, 0.6)],
    ],
    relationship: "Upright tower intersects the horizontal bank",
    label: "Axis relationship",
    elementsLabel: "Intersecting elements",
  },
  {
    type: "radiating",
    paths: [
      [first, last],
      [p(0.9, 0.8), last],
    ],
    relationship: "The two bank edges converge near the tower",
    label: "Directional relationship",
    elementsLabel: "Directional elements",
  },
];
for (const study of nonDirectionalStudies) {
  test(`${study.type}: supplied relationships never become Entry/Path/Landing`, () => {
    const overlay = fixture({
      type: study.type,
      paths: study.paths,
      teaching: teaching({ path: study.relationship }),
    });
    const rows = library.compositionTeachingRows(overlay);
    assert.equal(hasDirectionalRows(rows), false);
    assert.deepEqual(rows.slice(0, 2), [
      [study.elementsLabel, "Tower, Bank"],
      [study.label, study.relationship],
    ]);
    const suppliedText = new Set([
      ...Object.values(overlay.teaching),
      overlay.teaching.elements.join(", "),
    ]);
    assert(rows.every(([, text]) => suppliedText.has(text)));
    assert(!rows.some(([, text]) => text === overlay.teaching.entry));
    assert(!rows.some(([, text]) => text === overlay.teaching.landing));
    if (study.type === "u_frame") {
      assert(rows.some(([label]) => label === "Supporting frame"));
      assert(rows.some(([label]) => label === "Open space"));
    }
    if (study.type === "cross")
      assert(rows.some(([label]) => label === "Countering relationship"));
  });
  test(`${study.type}: absent teaching stays absent instead of inventing an explanation`, () => {
    const rows = library.compositionTeachingRows(
      fixture({
        type: study.type,
        paths: study.paths,
        teaching: teaching({
          elements: [],
          entry: null,
          path: null,
          landing: null,
          supportingMass: null,
          quietMass: null,
          counterbalance: null,
          risk: null,
        }),
      }),
    );
    assert.deepEqual(rows, []);
  });
}
for (const type of ["diagonal", "s_curve"]) {
  test(`${type}: supported directional teaching retains Entry/Path/Landing`, () => {
    const rows = library.compositionTeachingRows(
      fixture({
        type,
        paths: [[first, middle, last]],
        teaching: teaching(),
      }),
    );
    assert.deepEqual(
      rows.filter(([label]) => directionalLabels.includes(label)),
      [
        ["Entry", "Lower left bank"],
        ["Path", "Bank toward tower"],
        ["Landing", "Pale tower"],
      ],
    );
  });
}
test("L-shape opts into directional labels only with a saved open path, focal landing and complete teaching", () => {
  const overlay = fixture({
    type: "l_shape",
    paths: [[first, middle, last]],
    teaching: teaching(),
  });
  const rows = library.compositionTeachingRows(overlay);
  assert.deepEqual(
    rows.filter(([label]) => directionalLabels.includes(label)),
    [
      ["Entry", "Lower left bank"],
      ["Path", "Bank toward tower"],
      ["Landing", "Pale tower"],
    ],
  );
});
for (const [reason, patch] of [
  ["no saved path", { paths: null }],
  ["only two ordered anchors", { paths: [[first, last]] }],
  ["repeated anchors", { paths: [[first, first, last]] }],
  [
    "closed framing path",
    { paths: [[first, middle, last, first]], focalPoint: first },
  ],
  ["invalid coordinates", { paths: [[first, p(2, 0.5), last]] }],
  ["low confidence", { confidence: 0.5 }],
  ["no supplied focal anchor", { focalPoint: null }],
  ["path ends away from the focal anchor", { focalPoint: middle }],
  ["missing entry teaching", { teaching: teaching({ entry: null }) }],
  ["missing path teaching", { teaching: teaching({ path: null }) }],
  ["missing landing teaching", { teaching: teaching({ landing: null }) }],
  ["blank teaching", { teaching: teaching({ landing: " " }) }],
]) {
  test(`L-shape with ${reason} does not force directional terminology`, () => {
    const overlay = fixture({
      type: "l_shape",
      paths: [[first, middle, last]],
      teaching: teaching(),
      ...patch,
    });
    const rows = library.compositionTeachingRows(overlay);
    assert.equal(hasDirectionalRows(rows), false);
    assert.deepEqual(rows[0], ["L-shaped elements", "Tower, Bank"]);
    assert(rows.some(([label]) => label === "Open space"));
    if (overlay.teaching.path)
      assert(
        rows.some(
          ([label, text]) =>
            label === "L-shaped relationship" && text === overlay.teaching.path,
        ),
      );
  });
}
for (const type of ["balanced_masses", "steelyard"]) {
  test(`${type}: mass/counterbalance/negative-space teaching remains unchanged`, () => {
    assert.deepEqual(
      library.compositionTeachingRows(fixture({ type, teaching: teaching() })),
      [
        ["Major masses", "Tower, Bank"],
        ["Supporting weight", "Muted bank"],
        ["Negative space", "Open water"],
        ["Counterbalance", "Bank balances tower"],
        ["Watch", "Keep the tower dominant"],
      ],
    );
  });
}
test("rule of thirds retains its grid/focal geometry and existing teaching labels", () => {
  const overlay = fixture({
    type: "rule_of_thirds",
    paths: null,
    teaching: teaching(),
  });
  assert.deepEqual(library.compositionTeachingRows(overlay), [
    ["Visible elements", "Tower, Bank"],
    ["Supporting mass", "Muted bank"],
    ["Quiet space", "Open water"],
    ["Counterbalance", "Bank balances tower"],
    ["Watch", "Keep the tower dominant"],
  ]);
  const plan = library.createCompositionStructurePlan(overlay);
  assert.equal(plan.thirdsGrid, true);
  assert.deepEqual(plan.anchors, [{ point: last, role: "focal" }]);
  assert.deepEqual(plan.strokes, []);
});
test("none stays text-only even if older saved data contains directional teaching", () => {
  const overlay = fixture({ type: "none", teaching: teaching() });
  assert.deepEqual(library.compositionTeachingRows(overlay), []);
  assert.equal(library.createCompositionStructurePlan(overlay), null);
});
test("archetype-specific teaching preserves canonical geometry across all four views with zero extra calls", () => {
  const painting = load("shared/paintingAnalysis.ts");
  const canonicalFixture = require("./helpers/canonical-fixture.cjs");
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = () => {
    calls++;
    throw new Error("Teaching must remain local");
  };
  try {
    for (const study of [
      ...nonDirectionalStudies,
      ...[
        "diagonal",
        "s_curve",
        "l_shape",
        "balanced_masses",
        "rule_of_thirds",
      ].map((type) => ({
        type,
        paths: [[first, middle, last]],
        relationship: "Bank toward tower",
      })),
    ]) {
      const saved = canonicalFixture();
      const overlay = fixture({
        type: study.type,
        paths: study.paths,
        teaching: teaching({ path: study.relationship }),
      });
      saved.canonicalAnalysis.composition.primary = overlay;
      const before = structuredClone(saved);
      const plan = library.createCompositionStructurePlan(overlay);
      for (const view of painting.expertViewKeys) {
        const projection = painting.projectPaintingAnalysis(saved, view);
        const projected = projection.compositionOverlay;
        library.compositionTeachingRows(projected);
        assert.equal(
          metadata.compositionIdentity(projected),
          metadata.compositionIdentity(overlay),
        );
        assert.deepEqual(
          library.createCompositionStructurePlan(projected),
          plan,
        );
      }
      assert.deepEqual(saved, before);
    }
    assert.equal(calls, 0);
  } finally {
    global.fetch = originalFetch;
  }
});
test("canonical prompt teaches archetype-specific relationships instead of a universal eye-flow journey", () => {
  const prompt = load(
    "supabase/functions/_shared/prompts.ts",
  ).paintingAnalysisPrompt;
  for (const instruction of [
    "Entry / Path / Landing belong only to genuinely directional structures",
    "l_shape only when a saved open ordered path reaches its supplied focalPoint",
    "mass / counterbalance / negative space",
    "frame / opening / enclosed space",
    "Cross uses intersecting primary and countering axes",
    "Radiating uses convergence/divergence around a supported focal area",
    "Triangle uses three-point grouping/stability",
    "Repetition structures (three_spot/rhythm) use cadence / spacing",
    "Rule_of_thirds uses grid/focal placement; none stays text-only",
    "teaching.entry and teaching.landing are null",
  ])
    assert(prompt.includes(instruction), instruction);
  assert(
    !prompt.includes(
      "Composition explains the canonical structure, entry→path→landing",
    ),
  );
});
